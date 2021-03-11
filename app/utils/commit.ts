import octokit from "@/utils/octokit";
import { AnyRepo, ParsedRepo, parseRepo } from "@/utils/helpers";

// Adapted from
// https://github.com/mheap/octokit-commit-multiple-files

type TreeMode =
  | "100644"
  | "100755"
  | "040000"
  | "160000"
  | "120000"
  | undefined;
type TreeType = "tree" | "blob" | "commit" | undefined;

interface Change {
  message: string;
  files?: Record<
    string,
    string | { contents: string; mode?: TreeMode; type?: TreeType }
  >;
  filesToDelete?: [string, ...string[]];
  ignoreDeletionFailures?: boolean;
}

export default async function commit(args: {
  repo: AnyRepo;
  branch: string;
  changes: Change[];
  committer?: {
    name?: string;
    email?: string;
    date?: string;
  };
}) {
  const { branch: branchName, changes, committer } = args;
  const repo = parseRepo(args.repo);

  // Check for empty commits
  for (const change of changes) {
    const hasFilesToDelete =
      Array.isArray(change.filesToDelete) && change.filesToDelete.length > 0;
    const hasFiles =
      typeof change.files === "object" && Object.keys(change.files).length > 0;

    if (!hasFiles && !hasFilesToDelete) {
      throw new Error(`The commit "${change.message}" has no changes`);
    }
  }

  // SHA of the branch
  let baseTree = await loadRef({ repo, ref: branchName });

  for (const change of changes) {
    let treeItems: {
      path: string;
      sha: string | null;
      mode: TreeMode;
      type: TreeType;
    }[] = [];

    if (
      Array.isArray(change.filesToDelete) &&
      change.filesToDelete.length > 0
    ) {
      for (const fileName of change.filesToDelete) {
        const exists = await fileExistsInRepo({
          repo,
          path: fileName,
          ref: baseTree,
        });

        // `ignoreDeletionFailures` is false by default
        if (!exists && !change.ignoreDeletionFailures) {
          throw new Error(`The file ${fileName} could not be found in ${repo}`);
        }

        treeItems.push({
          path: fileName,
          sha: null, // sha as null implies that the file should be deleted
          mode: "100644",
          type: "commit",
        });
      }
    }

    if (
      typeof change.files === "object" &&
      Object.keys(change.files).length > 0
    ) {
      for (const fileName in change.files) {
        const file = change.files[fileName];
        let contents: string;
        let mode: TreeMode = "100644";
        let type: TreeType = "blob";

        if (typeof file === "string") {
          contents = file;
        } else {
          contents = file.contents;
          if (file.mode) mode = file.mode;
          if (file.type) type = file.type;
        }

        const fileSha = await createBlob({ repo, contents, type });

        treeItems.push({
          path: fileName,
          sha: fileSha,
          mode,
          type,
        });
      }
    }

    // Just in case...
    if (treeItems.length === 0) continue;

    const { data: tree } = await octokit.git.createTree({
      ...repo,
      tree: treeItems,
      base_tree: baseTree,
    });

    const { data: commit } = await octokit.git.createCommit({
      ...repo,
      message: change.message,
      committer,
      tree: tree.sha,
      parents: [baseTree],
    });

    baseTree = commit.sha;
  }

  await octokit.git.updateRef({
    ...repo,
    ref: `heads/${branchName}`,
    sha: baseTree,
  });
}

const createBlob = async ({
  repo,
  contents,
  type,
}: {
  repo: ParsedRepo;
  contents: string;
  type?: TreeType;
}) => {
  if (type === "commit") {
    return contents;
  } else {
    const res = await octokit.git.createBlob({
      ...repo,
      content: Buffer.from(contents).toString("base64"),
      encoding: "base64",
    });
    return res.data.sha;
  }
};

const fileExistsInRepo = async ({
  repo,
  path,
  ref,
}: {
  repo: ParsedRepo;
  path: string;
  ref: string;
}) => {
  try {
    await octokit.repos.getContent({
      ...repo,
      method: "HEAD",
      path,
      ref,
    });
    return true;
  } catch (e) {
    return false;
  }
};

const loadRef = async ({ repo, ref }: { repo: ParsedRepo; ref: string }) => {
  try {
    const res = await octokit.git.getRef({
      ...repo,
      ref: `heads/${ref}`,
    });
    return res.data.object.sha;
  } catch (e) {
    throw new Error(`The branch "${ref}" does not exists in ${repo}`);
  }
};

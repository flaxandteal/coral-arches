# Promoting Coral to a new version

## Prerequisites 

Only version up and tag your branch once it is ready to merge. This will prevent version and tag conflicts when attempting to push up the version bump.

## Correct branch and up to date

Make sure your currently on the branch you would like to promote to a new version. Double check you are up to date with the latest `origin/dev`.

```
git pull origin/dev
```

## Bumping the Python version

Navigate to `coral/settings.py`. Towards the top of the file you will see:

```
APP_VERSION = semantic_version.Version(major=3, minor=5, patch=2)
```

Depending on the level of your change you should increment the correct level of semantic versioning. For example:

- If you are working on a feature, `minor` should be bumped to 6.
- If you are working on a fix, `patch` should be bumped to 3.
- If you have implemented a breaking change that isn't backwards compatible. You should promote `major` to 4 and reset `minor` and `patch` to 0. Resulting in `4.0.0`.

## Committing a new version

After you have updated `settings.py` you will want to make a commit which **only** contains this file. The commit message format should be:

```
version: v3.5.2
```

## Tagging the new version

Following creation of the new commit you must tag the version that was used **on the same commit the version bump took place**. For example if I used `git log` the most recent commit message should read `version: v3.5.2`. Once you have confirmed your on the right commit run:

```
git tag v3.5.2
```

## Pushing the changes

That's it complete and you can push up the changes and the newly created tags using:

```
git push
git push --tags
```

# Git utility

To simplify the process, the following git alias is useful for creating the commit and tag at the same time. It works like so:

```
git ver v3.5.2
```

Which will create a new commit with the message `version: v3.5.2` and a new tag `v3.5.2`. They can then be pushed up to the repository.

## Functionality

Below is the operation of the version command. You can also use `git ver undo` to revert the version commit and tag.

```bash
!f() { \
    if [ "$1" = "undo" ]; then \
        git reset HEAD^ && git tag -d "$(git describe --tags $(git rev-list --tags --max-count=1))"; \
    else \
        git commit -m "version: $1" && git tag "$1"; \
    fi; \
}; f
```

## Configuring the alias

Run the following command to configure the alias onto your git config. If your curious you have a global `.gitconfig` at your user directory usually accessible at `~/.gitconfig`. Have a look with `more ~/.gitconfig` before and after to see the newly added alias.

```bash
git config --global alias.ver '!f() { \
    if [ "$1" = "undo" ]; then \
        git reset HEAD^ && git tag -d $(git describe --tags $(git rev-list --tags --max-count=1)); \
    else \
        git commit -m "version: $1" && git tag "$1"; \
    fi; \
}; f'
```

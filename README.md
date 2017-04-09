# Sync Sketch Plugins across multiple computers
This repository works thanks to Git Submodules System. It allows to create a meta-repository of small repositories and keep everything up to date without hasle. 

## Set up is simple:
```
  # go to Sketch.app's application support folder
  cd ~/Library/Application\ Support/com.bohemiancoding.sketch3/

  # move the Plugins folder to an easier to access spiot
  # I recommend ~/Sketch-Plugins/
  mv Plugins/ ~/path/to/new-folder

  # create a symlink so Sketch.app can find the new folder
  ln -s ~/path/to/new-folder Plugins

```

## Adding Plugins is simple
```
- you can just add the plugins files, like you would do to manually add a plugin.
or
- you can add another Sketch Plugin repo with : 
git submodule add "sketch plugin url"

```

## Syncing is simple
```
 git add .
 git commit -am 'added new plugin'
 git push

 # on a different computer
 git clone --recursive https://github.com/edenpulse/sketch-plugins-submodules.git

```
## Update all plugins

```
git pull --recurse-submodules

```
## To Remove a Plugin "submodule"

- Delete the relevant section from the .gitmodules file.
- Stage the .gitmodules changes git add .gitmodules
- Delete the relevant section from .git/config.
- Run git rm --cached path_to_submodule (no trailing slash).
- Run rm -rf .git/modules/path_to_submodule
- Commit git commit -m "Removed submodule <name>"
- Delete the now untracked submodule files
- rm -rf path_to_submodule


That's all ! Enjoy ! 

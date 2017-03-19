# Sync Sketch Plugins across multiple computers
This repository works thanks to Git Submodules System. It allows to create a meta-repository of small repositories and keep everything up to date without hasle. 

Set up is simple:
```
  # go to Sketch.app's application support folder
  cd ~/Library/Application\ Support/com.bohemiancoding.sketch3/

  # move the Plugins folder to an easier to access spiot
  # I recommend ~/Sketch-Plugins/
  mv Plugins/ ~/path/to/new-folder

  # create a symlink so Sketch.app can find the new folder
  ln -s ~/path/to/new-folder Plugins

```

Adding Plugins is simple
```
- you can just add the plugins files, like you would do to manually add a plugin.
or
- you can add another Sketch Plugin repo with : 
git submodule add "sketch plugin url"

```

Syncing is simple
```
 git add .
 git commit -am 'added new plugin'
 git push

 # on a different computer
 git clone --recursive https://github.com/edenpulse/sketch-plugins-submodules.git

```

That's all ! Enjoy ! 

var checkRestart = function(context) {
    var first = NSClassFromString("SketchRunner") == nil;
    if(first) return false;
    var isClassic = !SketchRunner.respondsToSelector(NSSelectorFromString("go:"));
    if(isClassic) {
        
        var classicBundle = AppController.sharedInstance().pluginManager().plugins().objectForKey("com.sketchrunner.Runner");
        if(classicBundle) {
            AppController.sharedInstance().pluginManager().disablePlugin(classicBundle)
        }
        
        var alert = NSAlert.alloc().init();
        var iconPath = context.plugin.urlForResourceNamed("icons/runner-icon.png");
        var iconImage = NSImage.alloc().initByReferencingFile(iconPath.path());
        
        alert.setMessageText("You've updated Runner!");
        alert.setInformativeText("Please restart Sketch to continue.");
        alert.setIcon(iconImage);
        alert.addButtonWithTitle("Quit Sketch");
        alert.addButtonWithTitle("Later");
        
        if(alert.runModal() == "1000") {
            NSApp.terminate(nil);
        }
        
        AppController.sharedInstance().pluginManager().reloadPlugins()
        
        return true;
    }
}

var go = function(context) {
    if(checkRestart(context)) return;
    try { SketchRunner.go(context); }
    catch(e) {
        if(Mocha.sharedRuntime().loadFrameworkWithName_inDirectory('Runner', NSBundle.bundleWithURL(context.plugin.url()).resourceURL().path())) {
            SketchRunner.go(context);
        }
    }
}

// Runner Classic

var onRun = function(context) {
    lf(context, function() {
       SketchRunner.launchWithContext(context);
       });
}
var onStart = function(context) {
    lf(context, function() {
       SketchRunner.startRunner(context);
       });
}
var onDocOpen = function(context) {
    lf(context, function() {
       SketchRunner.configureForDocument(context);
       })
}
var onRunAction = function(context) {
    var command = customCommands[context.command.identifier()];
    if (command) {
        command(context);
    }
}
var lf = function(context, callback) {
    var FRAMEWORK_NAME = "SketchRunner";
    try {
        callback();
    } catch(e) {
        var pluginBundle = NSBundle.bundleWithURL(context.plugin.url()),
        mocha = Mocha.sharedRuntime();
        if(mocha.loadFrameworkWithName_inDirectory(FRAMEWORK_NAME, pluginBundle.resourceURL().path())) {
            callback();
        } else {
            print("Error while loading framework '"+FRAMEWORK_NAME+"`");
        }
    }
}
var customCommands = {
    resizeSymbolToMaster : function(context) {
        var selection = context.selection,
        loop = selection.objectEnumerator(), layer;
        while(layer = loop.nextObject()) {
            if(layer.class() === MSSymbolInstance) {
                layer.resetSizeToMaster()
            }
        }
    }
}

var upgradeToPro = function(context) {
    
    var alert = NSAlert.alloc().init();
    var iconPath = context.plugin.urlForResourceNamed("icons/runner-icon.png");
    var iconImage = NSImage.alloc().initByReferencingFile(iconPath.path());
    
    alert.setMessageText("Switching to Runner Pro requires a Sketch restart");
    alert.setInformativeText("Please save your work before proceeding, and restart Sketch after the plugin has updated.");
    alert.setIcon(iconImage);
    alert.addButtonWithTitle("Switch to Pro");
    alert.addButtonWithTitle("Cancel");
    
    if(alert.runModal() != "1000") {
        return;
    }
    
    var manifestURL = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest").URLByAppendingPathExtension("json");
    var proManifestURL = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Resources").URLByAppendingPathComponent("Runner.framework").URLByAppendingPathComponent("Resources").URLByAppendingPathComponent("manifest").URLByAppendingPathExtension("json");
    
    var proManifestData = NSData.dataWithContentsOfURL(proManifestURL);
    
    var didSaveManifest = proManifestData.writeToURL_atomically(manifestURL, true);
    
    if(didSaveManifest) {
        NSApp.terminate(nil);
    } else {
        context.document.showMessage("❌ Update Failed. Please email hello@sketchrunner.com for help.");
    }
    
}

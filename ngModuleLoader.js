// Copyright 2017 Rainer Mager under the MIT License
// https://github.com/Qythyx/ngModuleLoader

/**
 * Base object for dynamically loading Angular JS modules and dependencies.
 * @param {string} moduleName The name of the module to load. This is used to register it in Angular.
 * @param {element} element The element passed into angular.bootstrap(). This is usually document.body.
 * @param {string[]} components The Angular components to dynamically load. These should be relative or
 * absolute URLs.
 * @param {string[]} dependencies A list of Angular dependencies, like 'ngMaterial'. This can null if there
 * are no dependencies. It can also be a single string if there is only one dependency.
 * @param {bool} debug A true value to enable console output debug message.
 */
function ngModuleLoader(moduleName, element, components, dependencies, debug) {
	var _self = this;
	var _cssLoaded = {};
	var _componentsToLoad = [];
	var _componentsLoading = {};
	var _componentsLoaded = {};
	var _componentInitializers = [];
	var _componentDependencies = {};

	addDependencies(dependencies);
	loadComponents(components);

	function addComponentsToLoad(components) {
		if (!components) return;
		if (components.constructor !== Array) components = [components];
		components.forEach(function (component) {
			if (!_componentsLoading.hasOwnProperty(component) && !_componentsLoaded.hasOwnProperty(component)) {
				_componentsToLoad.push(component);
			}
		});
	}

	function addDependencies(dependencies) {
		if (!dependencies) return;
		if (dependencies.constructor !== Array) dependencies = [dependencies];
		dependencies.forEach(function (dependency) {
			_componentDependencies[dependency] = true;
		});
	};

	function getScriptName() {
		var error = new Error()
			, source
			, lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/)
			, currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

		if ((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] != "")
			return source[1];
		else if ((source = currentStackFrameRegex.exec(error.stack.trim())))
			return source[1];
		else if (error.fileName != undefined)
			return error.fileName;
	}

	function handleScriptLoaded(component) {
		delete _componentsLoading[component];
		_componentsLoaded[component] = null;
		if (_componentsToLoad.length == 0 && Object.keys(_componentsLoading).length == 0) {
			var dependencies = Object.keys(_componentDependencies);
			_self.Log('Finished loading all dependencies. Initiating module ' + moduleName + ' with: ' + dependencies);
			angular.module(moduleName, dependencies);
			_componentInitializers.forEach(function (initializer) {
				_self.Log("Initializing " + initializer.name);
				initializer.fn();
			});
			angular.bootstrap(element, [moduleName]);
		}
	}

	function loadComponents(components) {
		addComponentsToLoad(components);
		while (_componentsToLoad.length > 0) {
			var component = _componentsToLoad.shift();
			_componentsLoading[component] = null;
			loadScript(component, handleScriptLoaded);
		}
	}

	function loadCSS(names) {
		if (!names) return;
		if (names.constructor !== Array) names = [names];
		names.forEach(function (name) {
			var url = name + '.css';
			if (!_cssLoaded.hasOwnProperty(url)) {
				_self.Log('Loading ' + url);
				var link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = url;
				// There are several events for cross browser compatibility.
				var cb = function () { _self.Log('Loaded ' + url); };
				link.onreadystatechange = cb;
				link.onload = cb;
				document.getElementsByTagName('head')[0].appendChild(link);
			}
		});
	}

	function loadScript(name, callback) {
		var url = name + '.js';
		_self.Log('Loading ' + url);
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.async = true;
		// There are several events for cross browser compatibility.
		var cb = function () { _self.Log('Loaded ' + url); callback(name); };
		script.onreadystatechange = cb;
		script.onload = cb;
		document.getElementsByTagName('head')[0].appendChild(script);
	}

	/**
	 * Registers a function to initialize an Angular component that is dynamically loaded. The function is run
	 * after all dependencies are loaded.
	 * @param {function} fn The function to run. Typically this function does the Angular registration for
	 * this component.
	 * @param {object} options Optional parameters for initialization. These can be any of:
	 * 'components:string[]'  a list of other components that this component depends on, 'css:string[]' a list
	 * of relative or absolute URLs to CSS files to load, or 'dependencies:string[]' a list of Angular
	 * dependenies like ngResource.
	 */
	this.InitComponent = function (fn, options) {
		if (options) {
			loadComponents(options.components);
			addDependencies(options.dependencies);
			loadCSS(options.css);
		}
		_componentInitializers.push({ name: getScriptName(), fn: fn });
	}

	/**
	 * Logs a message to the console if debug was true at construction.
	 * @param {arguments} arguments Arguments passed through to console.log.
	 */
	this.Log = function () { if (debug) { console.log.apply(this, arguments); } };
}
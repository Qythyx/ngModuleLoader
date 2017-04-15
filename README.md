# ngModuleLoader
ngModuleLoader is a simple script to dynamically load Angular modules with dependency support. The impetus for
this script is that I didn't like the idea that I needed to list all JS and CSS files in my main HTML file for
all modules and components. My thinking is that the purpose of modules and components is that they are
discrete, reusable pieces. They should know what dependencies they have, but the page that uses them shouldn't
need to know all those dependencies.

Furthermore, within a module you might have multiple components. Each component can have it's own dependencies
too. Those dependencies might be other JS files, like a service or controller, or they might be other base
Angular dependencies, like ngResource. Again, the top component should need to know about all of those
dependencies of each module.


## Quick Start
### Create an instace of ngModuleLoader for your module
```javascript
var MyModuleLoader = new ngModuleLoader(
	'MyModule',
	document.body,
	['MyModule/FooComponent', 'MyModule/BarComponent'],
	['ngMaterial'],
	true
);
```
This instance of `MyModuleLoader` becomes a globally accessible object that all successively loaded JS can
reference.

### In each component, initialize it via InitComponent()
```javascript
MyModuleLoader.InitComponent(
	function () {
		angular.module('MyModule')
			.component('FooComponent', {
				templateUrl: 'MyModule/FooComponent.template.html',
				controller: MyModule.FooComponent
			});
	},
	{ components: 'MyModule/Baz.service', css: 'MyModule/FooComponent' }
);

MyModule.FooComponent = function ($scope, Baz) {
	Baz.Get().$promise
		.then(function (result) {
			$scope.CoolStuff = result;
		});
}
```
This is basically normal Angular code. Although the controller's function could be inline in the
`InitComponent` function I find that adds additional levels of indent and visual noise, so I like to extract
it down below. I attach the function to the global `MyModule` object mostly to prevent it from being globally
exposed. There's no strict need to do this, but it keeps things segmented more cleanly.


## How It Works
So, how does this work? Well, the script is less than 150 lines, so it's prett short and easy to read through.
But, I'll describe it here anyway.

1. The constuction of a `ngModuleLoader` object passes in a list of components to load and other Anglar
   dependencies. The list of these dependencies is kept track of throughout the loading process to eventually
   be passed to `angular.module(moduleName, dependencies)` as is done normally in registering an Angular
   module.
1. The script loops through all of the passed in components to load and dynamically loads each. It also keeps
   track of any scripts that have been loaded and doesn't try to load the same script again.
1. When each component loads it call `InitComponent`, which registers a function to load after everything
   loads, and passes in any additional dependencies: Angular components, other custom components, or CSS. Each
   of these additional dependencies is added to the list and also loaded as above.
1. After all components are finished loading the module is registered in Angular along with the full list of
   Angular dependencies.
1. All of the initialization functions that were registered in `InitComponent` are run. These can't have been
   run earlier, because the depend on the module being registered, which finally happened in the previous
   step.


## Arguments

### ngModuleLoader Constructor
```javascript
function ngModuleLoader(moduleName, element, components, dependencies, debug)
```
Base object for dynamically loading Angular JS modules and dependencies.
#### Parameters
* `{string} moduleName` - The name of the module to load. This is used to register it in Angular.
* `{element} element` - The element passed into angular.bootstrap(). This is usually document.body.
* `{string[]} components` - The Angular components to dynamically load. These should be relative or absolute
URLs.
* `{string[]} dependencies` - A list of Angular dependencies, like 'ngMaterial'. This can null if there are no
  dependencies. It can also be a single string if there is only one dependency.
* `{bool} debug` - A true value to enable console output debug message.

### ngModuleLoader.InitComponent
```javascript
function InitComponent(fn, options)
```
Registers a function to initialize an Angular component that is dynamically loaded. The function is run after
all dependencies are loaded.

#### Parameters
* `{function} fn` - The function to run. Typically this function does the Angular registration for this
component.
* `{object} options` - Optional parameters for initialization. These can be any of:
	* `components:string[]` - A list of other components that this component depends on.
	* `css:string[]` - A list of relative or absolute URLs to CSS files to load.
	* `dependencies:string[]` - A list of Angular dependenies like `ngResource`.

### ngModuleLoader.Log
```javascript
function Log()
```
Logs a message to the console if debug was true at construction.

#### Parameters
* `{arguments} arguments` - Arguments passed through to `console.log()`.
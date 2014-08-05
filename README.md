# [gulp-mithril-components](https://github.com/eddyystop/gulp-mithril-components)

Create easily customized, multiple views for Mithril components, using a renderer template and mixins.

## Rudimentary usage

The gulp task:
```
gulp.task('components', function() {
  return gulp.src('./test/components/*.html')
    .pipe( require('gulp-mithril-components')({ showFiles:true }))
    .pipe( msxTransform ())
    .pipe( require('gulp-msx-logic') ())
    .pipe(gulp.dest('./test/build'))
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName);
    });
});
```

The renderer template `./templates/selectTmpl.js`
```
/** @jsx m *///[component] COMPONENT_NAME [template] ./templates/selectTmpl.js */
mc.COMPONENT_NAME = {
  view : function (ctrl, options) {
    options = options || {};
    return MIXIN('mixin1');
  }
}
```

The component definition `./components/selectList.html`
```
<!--js: ../templates/selectTmpl.js -->
<!-- Bootstrap select, options provide list  -->
<!--MIXIN mixin1 -->
<select class="form-control" onchange={ ctrl.onchange }>
  {/*% options.items.map(function (item) { %*/}
  {/*% return %*/}<option disabled={item.disabled}>{ item.name }</option>{/*%;%*/}
  {/*% }) %*/}
</select>
```

The resulting code `./build/selectList.js`
```
/** @jsx m *///[component] selectList [template] ./templates/selectAjax.js */
mc.selectList = {
  view : function (ctrl, options) {
    options = options || {};
    return m("select", {class:"form-control", onchange: ctrl.onchange }, [
      options.items.map(function (item) { 
        return m("option", {disabled:item.disabled}, [ item.name ]);
      }) 
    ]);
  }
};
```

## The problem being addressed 

There are design issues with generalized Mithril components,
especially when they are targeted at CSS frameworks,
which don't exist with customized components for your own or limited use.

#### Styling

Do you use your own customized class names?
Devs using Bootstrap or Zurb Foundation might not be excited by that, 
as they may have to use Less or Sass mixins to relate your component classes to the CSS framework's.
 
Will you obtain the class names from the renderer's `options`?
Devs might not be excited to code these whenever a component is used.

#### Structure

CSS frameworks require specific nested tags to work properly.
A `< div>` with a specific class name often requires a child `< div>` with another specific class name,
and this structure is not consistent between CSS frameworks.

#### Complexity

Bootstrap provides a **lot** of capability, most of it extensively documented,
and some of it _creative_.
Devs, if they are limited to a subset of these capabilities,
would either have to limit themselves to that,
or to expand the components with customization.

Should you decide to write components which do much of what Bootstrap allows,
your options will mirror Bootstrap, only using your own notation.
Who would enjoy such duplication?

#### Dev vs Web Designer

Projects could be more productive if web designers could frequently customize components themselves. 
React's experience suggests its unlikely web designers would like to modify `m()` calls.
They would prefer working in HTML.

## The solution

The dev writes the template for a component renderer.
The web designer (or the dev) writes HTML mixins which, 
when merged with the template, result in specific capabilities.

This approach allows the web designer to change the styling and structure if needed.
The web designer can create new versions of components,
often without help from a dev.
The web designer works in HTML.

### Example: dropdown component

`./controllers/DropdownCtrl.js`
is the controller for all dropdown components.
```
// options: <props> tabName() <event> onclickTab
mc.DropdownCtrl = function (options) {
  options = options || {};
  this._isDropdownOpen = false;
  this._dropdownId = 0;

  this._onclickTab = function (name) {
    this._isDropdownOpen = false;
    mc._comm.lastDropdownId = -1; // will force closed any open dropdowns
    if (typeof options.tabName === 'function') { options.tabName(name); }
    if (options.onclickTab) { options.onclickTab(name); }
  }.bind(this);

  this._onclickDropdown = function () {
    this._isDropdownOpen = !this._isDropdownOpen;
    mc._comm.lastDropdownId = this._dropdownId = Date.now();
  }.bind(this);

  this.closeDropdown = function () {
    this._isDropdownOpen = false;
  }.bind(this);
};
```

`./templates/dropdownTmpl.js`
is the template for the renderer for all dropdown components:
```
// ctrl: <props> _isDropdownOpen, _dropdownId <events> _onclickTab, onClickDropdown
// options: label, isDisabled, isActive, classes, dropdown[]
// dropdown[]: <props> label, isActive, isDisabled, redirectTo <events> _onclickTab
// classes: btn-default -primary -success -info -warning -danger -link
// classes: btn-lg -sm -xs
// classes: btn-block

mc.COMPONENT_NAME = function (ctrl, options) {
  options = options || {};
  options.label = options.label || options.name;

  if (ctrl._dropdownId !== mc._comm.lastDropdownId) { ctrl.closeDropdown(); }

  return MIXIN('main');

  function displayMenu () {
    return MIXIN('menu');
  }

  function classMain () {
    return (options.classes || '' ) +
      (ctrl._isDropdownOpen ? ' open' : '') +
      (options.isDisabled ? ' disabled' : '') +
      (options.isActive ? ' active' : '');
  }

  function displayMenuList () {
    if (!ctrl._isDropdownOpen) { return null; }

    return m('ul.dropdown-menu' + (options.dropdown.alignRight ? '.dropdown-menu-right' : ''),
      options.dropdown.map(function (menuItem) {

        switch (menuItem.type) {
          case 'divider':
            return m('li.divider', {style:{margin: '6px 0px'}}, ''); // .divider's 9px is not visible; px in 0px req'd for tests
          case 'header':
            return m('li.dropdown-header', {tabindex: '-1'}, menuItem.label || menuItem.name);
          default:
            return viewTab(
              mc.utils.extend({}, menuItem, { isActive: false, _onclickTab: ctrl._onclickTab })
            );
        }
      })
    );
  }

  function viewTab (ctrl) {
    var href = '',
      attr = {};

    if (!ctrl.isDisabled) {
      if (ctrl.redirectTo) {
        href = '[href="' + ctrl.redirectTo + '"]';
        attr = {config : m.route};
      } else {
        attr = {onclick : ctrl._onclickTab.bind(this, ctrl.name)};
      }
    }

    return m('li' + (ctrl.isActive ? '.active' : '') + (ctrl.isDisabled ? '.disabled' : ''),
      m('a' + href, attr, ctrl.label || ctrl.name || '')
    );
  }
};
```

`./components/btnDropdownList.html`
creates a component for Bootstrap button dropdowns.

```
<!--js: ../templates/dropdownTmpl.js -->
<!-- Bootstrap button dropdown, options provide label and menu -->
<!--MIXIN main -->
<div class={'dropdown' + classMain() }>
  <button class="btn btn-primary dropdown-toggle" type="button" onclick={ ctrl._onclickDropdown }>
    <span>{ options.label } </span>
    <span class="caret"></span>
  </button>
  {/*% , displayMenuList() %*/}
</div>
<!--MIXIN menu -->
```

The result is `./build/btnDropdownList.js`
```
mc.btnDropdownList = function (ctrl, options) {
  options = options || {};
  options.label = options.label || options.name;

  if (ctrl._dropdownId !== mc._comm.lastDropdownId) { ctrl.closeDropdown(); }

  return m("div", {class:'dropdown' + classMain() }, [
      m("button", {class:"btn btn-primary dropdown-toggle", type:"button", onclick: ctrl._onclickDropdown }, [
        m("span", [ options.label,  " " ]),
        m("span", {class:"caret"})
      ])
      , displayMenuList() 
    ]);

  function displayMenu () {
    return ;
  }

  function classMain () {
    return (options.classes || '' ) +
      (ctrl._isDropdownOpen ? ' open' : '') +
      (options.isDisabled ? ' disabled' : '') +
      (options.isActive ? ' active' : '');
  }

  ... The rest is the same as in the template ...
};
```

The component may be used as follows:
```
var app = {
    controller: function () {
      this.tabName = m.prop('');
      this.dropdownCtrl = new mc.DropdownCtrl({ tabName: this.tabName })
    },
    
    view: function (ctrl) {
      var options = {
          name: 'dropdown0',
          label: 'Button dropdown',
          dropdown: [
            {label: 'Featured car', type: 'header' },
            {name: 'tesla', label: 'Tesla Model S'},
            {name: 'hummer', label: 'Hummer', isDisabled: true },
            {type: 'divider' },
            {label: 'Approved cars', type: 'header' },
            {name: 'prius plugin', label: 'Toyota Prius Plugin' },
            {name: 'prius v', label: 'Toyota Prius v' },
            {label: 'Exit bar', redirectTo: '/bar'}
          ]
      };
    
      return m('.container', [
        mc.btnDropdownList(ctrl.dropdownCtrl, options),
        m('p', 'selected tab is ' + ctrl.tabName)
      ]);
    }
};
```

The web designer can take a copy of `./components/btnDropdownList.html`
(which is a button dropdown)
and modify it to create a split button dropup:
```
<!--js: ../templates/dropdownTmpl.js -->
<!-- Bootstrap split button dropup, options provide label and menu -->
<!--MIXIN main -->
<div class={'btn-group dropup' + classMain() }>
  <button class="btn btn-primary" type="button" onclick={ ctrl._onclickDropdown }>{ options.label } </button>
  <button class="btn btn-primary dropdown-toggle" type="button" onclick={ ctrl._onclickDropdown }>
    <span class="caret"></span>
    <span class="sr-only">Toggle dropdown</span>
  </button>
  {/*% , displayMenuList() %*/}
</div>
<!--MIXIN menu --> 
```

The above modification is straightforward for someone familiar with Bootstrap.
The target HTML is also well documented in the Bootstrap docs.

Here is the component for a dropdown tab as needed in a tabs control:
```
<!--js: ../templates/dropdownTmpl.js -->
<!-- Bootstrap tabs dropdown, options provide label and menu -->
<!--MIXIN main -->
<li class={'dropdown' + classMain() }>
  <a class="dropdown-toggle" onclick={ ctrl._onclickDropdown }>
    <span>{ options.label } </span>
    <span class="caret"></span>
  </a>
  {/*% , displayMenuList() %*/}
</li>
<!--MIXIN menu -->
```

Here's a dropdown which uses no options when rendering:
```
<!--js: ../templates/dropdownTmpl.js -->
<!-- Bootstrap button dropdown, customized for cars -->
<!--MIXIN main -->
<div class={'dropdown' + classMain() }>
  <button class="btn btn-primary dropdown-toggle" type="button" onclick={ ctrl._onclickDropdown }>
    <span>Customized cars </span>
    <span class="caret"></span>
  </button>
  {/*% , displayMenu() %*/}
</div>
<!--MIXIN menu -->
<ul class="dropdown-menu">
  <li class="dropdown-header" tabindex="-1">Featured car</li>
  <li><a onclick={ ctrl._onclickTab.bind(this, 'tesla') }>Tesla Model S</a></li>
  <li class="disabled"><a onclick={ ctrl._onclickTab.bind(this, ctrl.name) }>Hummer</a></li>
  <li class="divider" style="margin: 6px 0px;"></li>
  <li class="dropdown-header" tabindex="-1">Approved cars</li>
  <li><a onclick={ ctrl._onclickTab.bind(ctrl, 'prius plugin') }>Toyota Prius Plugin</a></li>
  <li><a onclick={ ctrl._onclickTab.bind(ctrl, 'prius v') }>Toyota Prius v</a></li>
</ul>
```

You may also use pure Mithril:
```
<!--js: ../templates/dropdownTmpl.js -->
<!-- Bootstrap button dropdown, just Mithril -->
<!--MIXIN main -->
m("div", {class:'dropdown' + classMain() }, [
  m("button", {class:"btn btn-primary dropdown-toggle", type:"button", onclick: ctrl._onclickDropdown }, [
    m("span", [ options.label,  " " ]),
    m("span", {class:"caret"})
  ])
  , displayMenuList() 
]
<!--MIXIN menu -->
```

#### See it live

Most of these examples appear on the web page at `./public/btnDropdown.html`. 

## Usage

Include the following in your Gulp pipeline before the mxs transform:
```
.pipe( require('gulp-mithril-components') ({ showFiles:true }))
```

`showFiles` may be a string, true or false (default).

A complete Gulp task may look like:
```
gulp.task('components', function() {
  return gulp.src('./test/components/*.html')
    .pipe( require('gulp-mithril-components')({ showFiles:true }))
    .pipe( msxTransform ())
    .pipe( require('gulp-msx-logic') ())
    .pipe(gulp.dest('./test/build'))
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName);
    });
});
```

## Additional capabilities

The .js template file, or the .html component file 
may include portions of other files, and this is recursive.
```
return INCLUDE('path/to/file.html') // entire file
return INCLUDE('path/to/file.html:mixinName') // only that mixin
```

### With thanks to

gulp-mithril-components builds on 
[gulp-include-js](https://github.com/ng-vu/gulp-include-js).
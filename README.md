# [gulp-mithril-components](https://github.com/eddyystop/gulp-mithril-components)

Create easily customized, multiple views for Mithril components, using a template and mixins.

### The problem 

There are design issues involved in writing generalized Mithril components,
especially when they are targeted at CSS frameworks,
which don't exist when writing customized components for your own, or limited use.

#### Styling

Do you code specialized class names?
Devs using Bootstrap or Zurb Foundation might not be excited by that, 
as they may have to use Less or Sass mixins to relate your component classes to the CSS framework's.
 
Do you obtain the class names from the view's `options`?
Devs might not be excited to code these whenever a component is used.

#### Structure

CSS frameworks require specific nested tags to work properly.
A `< div>` with one class name must have a child `< div>` with another,
and this structure is not consistent between CSS frameworks.

#### Complexity

Bootstrap provides a **lot** of flexibility, most of it extensively documented,
and some of it _creative_.
Devs, if they are limited to a subset of these capabilities,
would either have to limit themselves to the subset,
or expand the capabilities themselves.

Should you decide to write components which do much of what Bootstrap allows,
your options will mirror Bootstrap, only using your own notation.
What dev would enjoy this?

#### Dev vs Web Designer

Projects could be more productive if web designers could customize components themselves. 
React's experience suggests its unlikely web designers would like to modify `m()` calls.
They would prefer working in HTML.

### Our approach to a solution

We propose an approach where the dev writes the template for a component,
and where the web designer writes HTML mixins which are merged with the template.

./controllers/DropdownCtrl.js
is the controller for all dropdown components:
```
// options: <props> tabName() <event> onclickTab
mc.DropdownCtrl = function (options) {
  options = options || {};
  this._isDropdownOpen = false;
  this._dropdownId = 0;

  this._onclickTab = function (name) {
    console.log('onclickTab')
    this._isDropdownOpen = false;
    mc._comm.lastDropdownId = -1; // will force closed any open dropdowns
    if (typeof options.tabName === 'function') { options.tabName(name); }
    if (options.onclickTab) { options.onclickTab(name); }
  }.bind(this);

  this._onclickDropdown = function () {
    console.log('onclickDropDown')
    this._isDropdownOpen = !this._isDropdownOpen;
    mc._comm.lastDropdownId = this._dropdownId = Date.now();
  }.bind(this);

  this.closeDropdown = function () {
    this._isDropdownOpen = false;
  }.bind(this);
};
```

./templates/dropdownTmpl.js
is the template for the renderer for all dropdown components:
```
// ctrl: <props> _isDropdownOpen, _dropdownId <events> _onclickTab, onClickDropdown
// options: label, isDisabled, isActive, classes, dropdown[]
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

./components/btnDropdownList.html
creates a component for Bootstrap button dropdowns:
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

The result is ./cbuild/btnDropdownList.js
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

The web designer could take a copy of ./components/btnDropdownList.html
(which is a button dropdown)
and, using Bootstrap documentation, modify it to create a split button dropup:
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

### Usage


### Usage

Include the following in your Gulp pipeline before the mxs transform:
```
.pipe(require('gulp-mithril-components')({showFiles:true}))
```

`showFiles` may be a string, true or false (default).

The complete Gulp task may look like:
```
gulp.task('components', function() {
  return gulp.src('./test/components/*.html')
    .pipe(mithrilComponents({showFiles:true}))
    .pipe(msxTransform())
    .pipe(msxLogic())
    .pipe(gulp.dest('./test/build'))
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName);
    });
});
```
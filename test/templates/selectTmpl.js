/** @jsx m *///[component] COMPONENT_NAME [template] ./templates/selectAjax.js */
mc.COMPONENT_NAME = {
  controller : function (options) {
    options = options || {};
    this.value = typeof options.option === 'function' ? options.option() : options.option;

    this.onchange = function (e) {
      this.value = e.target.options[e.target.selectedIndex].value;
      if (typeof options.value === 'function') { options.value(this.value); }
      if (options.onclickTab) { options.onclickTab(this.value); }
      console.log('clicked', this.value);
    }.bind(this);
  },

  view : function (ctrl, options) {
    options = options || {};
    return MIXIN('mixin1');

  }
};
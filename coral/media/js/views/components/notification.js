define([
  'jquery',
  'knockout',
  'moment',
  'arches',
  'templates/views/components/notification.htm'
], function ($, ko, moment, arches, notificationTemplate) {
  /**
   * A generic component for displaying notifications
   * @name NotificationViewModel
   **/

  function NotificationViewModel(params) {
    var self = this;

    this.info = ko.observable();

    this.displaytime = moment(params.created).format('dddd, DD MMMM YYYY | hh:mm A');
    this.id = params.id;
    this.loadedResources = params.loaded_resources;
    this.state = params._state;
    this.link = params.link;
    this.message = params.message;
    this.files = params.files;
    console.log("STATE", this.state)
    this.dismiss = function (parent) {
      $.ajax({
        type: 'POST',
        url: arches.urls.dismiss_notifications,
        data: { dismissals: JSON.stringify([self.id]) }
      }).done(function () {
        if (parent) {
          var item = parent.items().find(function (item) {
            return item.id === self.id;
          });
          parent.items.remove(item);
        }
      });
    };

    this.openFlagged = (resourceId, responseSlug) => {
      localStorage.setItem('workflow-open-mode', JSON.stringify(true));
      let url = arches.urls.plugin(
        `${responseSlug}?resource-id=${resourceId}`
      );
      window.window.location = url;
    };

    this.getExportFile = function () {
      $.ajax({
        type: 'GET',
        url: arches.urls.get_export_file,
        data: { exportid: self.link }
      }).done(function (data) {
        if (data.url) {
          window.open(data.url);
        } else {
          self.info(data.message);
        }
      });
    };
  }

  ko.components.register('notification', {
    viewModel: NotificationViewModel,
    template: notificationTemplate
  });

  return NotificationViewModel;
});

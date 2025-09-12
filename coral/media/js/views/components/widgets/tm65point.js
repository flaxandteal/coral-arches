define([
  'knockout',
  'proj4',
  'underscore',
  'viewmodels/widget',
  'templates/views/components/widgets/irishGrid.htm'
], function (ko, proj4, _, WidgetViewModel, tm65pointTemplate) {
  /**
   * registers a text-widget component for use in forms
   * @function external:"ko.components".text-widget
   * @param {object} params
   * @param {string} params.value - the value being managed
   * @param {function} params.config - observable containing config object
   * @param {string} params.config().label - label to use alongside the text input
   * @param {string} params.config().placeholder - default text to show in the text input
   */
  return ko.components.register('tm65point', {
    viewModel: function (params) {
      // CS - The following instantiate the variables and do not execute again after loading
      params.configKeys = ['placeholder'];
      WidgetViewModel.apply(this, [params]);
      var self = this;
      this.coordOptions = ['Alphanumeric TM65', 'Absolute TM65', 'Long/Lat'];
      this.coordFormat = ko.observable('Alphanumeric TM65');
      this.isSelected = ko.observable(false);
      this.errorMessage = ko.observable();
      this.messageVisible = ko.observable(false);
      this.disabled = ko.observable(params.disabled)

      if (this.value()) {
        this.tm65Val = ko.observable(this.value());
      } else {
        this.tm65Val = ko.observable();
      }

      // If changed externally this will update it
      this.value.subscribe((value) => {
        this.tm65Val(value);
      });

      this.finalGridNumber = function (numberIn) {
        // CS - This function adds zeros onto a number until the number's length is 5

        var fullNumber = 5;
        while (numberIn.length < fullNumber) {
          numberIn = numberIn + '0';
        }
        return numberIn;
      };

      this.alphanumericTransform = function (alphaTM65, TM65Keys) {
        // CS - takes an alphanumeric value and ensures it has a valid grid square and 10 numbers in the value string.
        try {
          var gridSquareLetters = alphaTM65.substring(0, 2);
          gridSquareLetters = gridSquareLetters.toUpperCase();
          var gridSquareNumbers = alphaTM65.substring(2);
          var gridSquareNumbersSplit = gridSquareNumbers.length / 2;

          if (TM65Keys.includes(gridSquareLetters)) {
            var gridSquareEasting = gridSquareNumbers.substring(0, gridSquareNumbersSplit);
            var gridSquareNorthing = gridSquareNumbers.substring(gridSquareNumbersSplit);

            var finalGridSquareEasting = this.finalGridNumber(gridSquareEasting);
            var finalGridSquareNorthing = this.finalGridNumber(gridSquareNorthing);

            var finalGridReference =
              gridSquareLetters + finalGridSquareEasting + finalGridSquareNorthing;
            return finalGridReference;
          } else {
            console.log(
              'Could not return a correct Alphanumeric grid reference.  Please check your input absolute grid reference and try again.'
            );
            return '';
          }
        } catch (err) {
          console.log(
            err +
              '\nCould not return a correct Alphanumeric grid reference.  Please check your input absolute grid reference and try again.'
          );
          return '';
        }
      };

      this.absoluteTM65Transform = function (absoluteTM65, gridSquareArray) {
        // CS - Takes an absolute grid reference, checks it only contains numbers, works out the 100km grid quare
        // value and then pads the numerical value to create an Alphanumeric Grid Reference.
        try {
          var absoluteTM65 = absoluteTM65.replace(',', '');
          var absoluteTM65AsNumber = Number(absoluteTM65);
          if (isNaN(absoluteTM65AsNumber)) {
            console.log(
              'Entered valid is not numeric.  Please check your input absolute grid reference and try again.'
            );
            return '';
          } else {
            var absoluteTM65Split = absoluteTM65.length / 2;
            var firstEastingAbsoluteTM65 = absoluteTM65.substring(0, 1);
            var firstNorthingAbsoluteTM65 = absoluteTM65.substring(
              absoluteTM65Split,
              absoluteTM65Split + 1
            );
            var firstValues = [Number(firstEastingAbsoluteTM65), Number(firstNorthingAbsoluteTM65)];

            var mainEastingAbsoluteTM65 = absoluteTM65.substring(1, absoluteTM65Split);
            var mainNorthingAbsoluteTM65 = absoluteTM65.substring(absoluteTM65Split + 1);

            var finalMainEastingAbsoluteTM65 = this.finalGridNumber(mainEastingAbsoluteTM65);
            var finalMainNorthingAbsoluteTM65 = this.finalGridNumber(mainNorthingAbsoluteTM65);

            var gridSquare = '';

            for (var key in gridSquareArray) {
              var gridValueFromArray = gridSquareArray[key].toString();
              if (gridValueFromArray === firstValues.toString()) {
                gridSquare = key;
                break;
              }
            }

            if (gridSquare !== '') {
              var finalOutputGridReference =
                gridSquare + finalMainEastingAbsoluteTM65 + finalMainNorthingAbsoluteTM65;
              return finalOutputGridReference;
            } else {
              return '';
            }
          }
        } catch (err) {
          console.log(
            err +
              '\nIssue transforming input coordinates into an Alphanumeric grid reference.  Please check your value is in a correct format at try again.'
          );
          return '';
        }
      };

      this.longLatTransform = function (latLong, gridSquareList) {
        // CS - uses the Proj4JS module to reproject long/lat values to an absolute TM65 value and then calls upon the
        // absoluteTM65Transform function to create an Alphanumeric Grid Reference.

        // WSG84 (long/lat)
        proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

        // TM75
        proj4.defs(
          'EPSG:19972',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +ellps=airy +datum=TM65 +units=m'
        );

        proj4.defs(
          'EPSG:29901',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1 +x_0=200000 +y_0=250000 +ellps=airy +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +units=m +no_defs +type=crs'
        );
        // TM65
        proj4.defs(
          'EPSG:29902',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +a=6377340.189 +rf=299.3249646 +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +units=m +no_defs +type=crs'
        );
        proj4.defs(
          'EPSG:29903',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +a=6377340.189 +rf=299.3249646 +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +units=m +no_defs +type=crs'
        );

        // ITM style grid references
        proj4.defs(
          'EPSG:2157',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
        );
        proj4.defs(
          'EPSG:9922',
          '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +units=m +vunits=m +no_defs +type=crs'
        );

        var latLongSplit = latLong.split(',');
        var longValue = Number(latLongSplit[0]);
        var latValue = Number(latLongSplit[1]);
        var longLatCoord = [longValue, latValue];
        try {
          var reprojectOSGBCoords = proj4('EPSG:4326', 'EPSG:29901', longLatCoord);
          var reprojectOSGB_X = Math.round(reprojectOSGBCoords[0]);
          var reprojectOSGB_Y = Math.round(reprojectOSGBCoords[1]);

          var reprojectOSGB = reprojectOSGB_X.toString() + ',' + reprojectOSGB_Y.toString();

          try {
            var reprojectAlphaOSGB = this.absoluteTM65Transform(reprojectOSGB, gridSquareList);
            return reprojectAlphaOSGB;
          } catch (err) {
            console.log(err);
          }
        } catch (err) {
          console.log(
            err +
              '\nIssue reprojecting long/lat coordinates.  Please check your value is in a correct format at try again.'
          );
          return '';
        }
      };

      this.validateInput = function (finalTM65, gridSquareValues) {
        // CS - Checks that the value to be added is a valid Alphanumeric TM65 reference with length 12.
        if (finalTM65 !== '') {
          var firstCharacter = finalTM65.substring(0, 1);
          var numberElement = finalTM65.substring(1);
          if (gridSquareValues.includes(firstCharacter)) {
            if (!isNaN(Number(numberElement))) {
              if (finalTM65.length === 11) {
                return true;
              } else {
                return false;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      };

      this.preview = ko.pureComputed(function () {
        var gridSquare = {
          A: [0, 4],
          B: [1, 4],
          C: [2, 4],
          D: [3, 4],
          E: [4, 4],
          F: [0, 3],
          G: [1, 3],
          H: [2, 3],
          J: [3, 3],
          K: [4, 3],
          L: [0, 2],
          M: [1, 2],
          N: [2, 2],
          O: [3, 2],
          P: [4, 2],
          Q: [0, 1],
          R: [1, 1],
          S: [2, 1],
          T: [3, 1],
          U: [4, 1],
          V: [0, 0],
          W: [1, 0],
          X: [2, 0],
          Y: [3, 0],
          Z: [4, 0]
        };

        pre = this.tm65Val();
        var gridLettersValueArray = Object.keys(gridSquare);
        if (this.isSelected() === true) {
          this.errorMessage('');
        } else {
          if (pre) {
            if (this.coordFormat() === 'Alphanumeric TM65' && pre) {
              pre = pre.replace(' ', '');
              var firstInValue = pre.substring(0, 1);
              if (gridLettersValueArray.includes(firstInValue)) {
                if (pre.length === 11) {
                  pre = pre;
                } else {
                  pre = this.alphanumericTransform(pre, gridLettersValueArray);
                }
              } else {
                pre = '';
              }
            } else if (this.coordFormat() === 'Absolute TM65' && pre) {
              pre = pre.replace(' ', '');
              pre = this.absoluteTM65Transform(pre, gridSquare);
            } else if (this.coordFormat() === 'Long/Lat' && pre) {
              pre = pre.replace(' ', '');
              pre = this.longLatTransform(pre, gridSquare);
            } else if (this.coordFormat() === undefined && pre) {
              this.errorMessage(
                'You have not selected a coordinate format.  Please do so and enter the coordinate value again.'
              );
              pre = '';
              return;
            } else {
              pre = '';
            }

            // Final Validation
            if (this.validateInput(pre, gridLettersValueArray) === true) {
              this.value(pre);
              this.errorMessage('');
              this.messageVisible(false);
              return pre;
            } else {
              this.value('');
              this.errorMessage(
                'Input coordinate did not pass validation.  Please check it is in one of the approved formats and try again.'
              );
              return '';
            }
          } else {
            this.errorMessage('');
          }
        }
      }, this);
    },
    template: tm65pointTemplate
  });
});

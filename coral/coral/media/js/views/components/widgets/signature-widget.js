define([
    'underscore',
    'jquery',
    'knockout',
    'viewmodels/file-widget',
    'signature_pad',
    'templates/views/components/widgets/signature-widget.htm'
], function(_, $, ko, FileWidgetViewModel, SignaturePad, signatureWidgetTemplate) {
    return ko.components.register('signature-widget', {
        viewModel: function(params) {
            FileWidgetViewModel.apply(this, [params]);
            this.uploadMulti(false)
            const canvas = document.querySelector("#canvas");
            const self = this
            this.signatureBlob = ko.observable()
            this.savedSignature = ko.observable(false)
            const pad = new SignaturePad.default (canvas, {
                
            })
            this.selectedPhoto = ko.observable();
            this.selectedPhoto(this.filesJSON()[0] || this.uploadedFiles()[0]);
            console.log("photo",this.selectedPhoto())
            this.selectPhoto = function(photo) {
                self.filesJSON().forEach(function(f) {
                    f.selected(false);
                });
                self.selectedPhoto(photo);
                photo.selected(true);
            };
            
            this.hoveredOverImage = ko.observable(false);
            this.toggleHoveredOverImage = function(val, event){
                var res = event.target === event.toElement ? true : false;
                this.hoveredOverImage(res);
            };

            console.log(pad)
            console.log(pad.isEmpty())
            pad.addEventListener("beginStroke", () => {
                console.log("Signature started");
              }, { once: true });

            function resizeCanvas() {
                const ratio =  Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                pad.clear(); // otherwise isEmpty() might return incorrect value
            }
            this.filesJSON.subscribe(function(val){
                console.log("sigi files", val)
                val.forEach(function(photo){
                    if (ko.unwrap(photo.selected) === undefined || ko.isObservable(photo.selected) === false) {
                        photo.selected = ko.observable(false);
                    }
                });
                if (val.length > 1 && self.selectedPhoto() === undefined) {
                    self.selectedPhoto(val[0]);
                }
            })
            if (this.tile?.data['fd8eeb80-770e-11ee-a6cc-0242ac120002']() && this.tile?.data['fd8eeb80-770e-11ee-a6cc-0242ac120002']()?.length > 0) {
                pad.fromDataURL(this.tile.data['fd8eeb80-770e-11ee-a6cc-0242ac120002']()[0].url)
                pad.off()
                console.log("found a sigi", this.tile.data['fd8eeb80-770e-11ee-a6cc-0242ac120002']()[0].content)
            }

            this.edit = function () {
                pad.clear()
                pad.on()
                this.filesForUpload()
            }

            this.save = function() {
                console.log("save")
                signature = pad.toDataURL()
                // signatureB64 = signatue.split(',')[1]
                console.log(signature)
                console.log(this)
                // const byteCharacters = atob(signatureB64);
                // const byteNumbers = new Array(byteCharacters.length);
                // for (let i = 0; i < byteCharacters.length; i++) {
                //     byteNumbers[i] = byteCharacters.charCodeAt(i);
                // }
                // const byteArray = new Uint8Array(byteNumbers);

                fetch(signature)
                .then(res => res.blob())
                .then(blob => {
                    this.signatureBlob(blob)
                    console.log(this.signatureBlob())
                    blob.name = "signature_test.png"
                    blob.accepted = true
                    this.filesForUpload([blob])
                    // console.log(this.tile.data['97ae2eb8-74af-11ee-bd38-0242ac120002']())
                })
                
            }
            
            window.addEventListener("resize", resizeCanvas);
            resizeCanvas();
        },
        template: signatureWidgetTemplate,
    });
});
(function() {

    var name, bytes, currentGallery;
    var repositories = sdr.createRepositories();
    var itemRepository = repositories.itemRepository;
    var galleryRepository = repositories.galleryRepository;

    function readImage(input) {
        if (input.files && input.files[0]) {
            if (input.files[0].type.indexOf('image') != -1) {
                var FR = new FileReader();
                FR.onloadend = function () {
                    name = input.files[0].name;
                    bytes = FR.result;
                }
                FR.readAsDataURL(input.files[0]);
            }
        }
    }

    function deletePic(item) {
        itemRepository.delete(id(item)).done(function () {
            window.location.reload();
        });
    }

    function addToSelectedGallery(item) {
        var addItems = galleryRepository.addItems(currentGallery, item);
        var setGallery = itemRepository.setGallery(item, currentGallery);

        $.when(addItems, setGallery).then(function () {
            window.location.reload();
        });
    }

    function id(resource) {
        var parts = resource._links.self.href.split("/");
        return parts[parts.length - 1];
    }

    function removePicByResource(item, gallery) {
        var removeItems = galleryRepository.removeItems(gallery, id(item));
        var deleteGallery = itemRepository.deleteGallery(item);

        $.when(removeItems, deleteGallery).then(function () {
            window.location.reload();
        });
    }

    function drawGalleryTable(data) {
        var table = $('<table></table>');
        table.append('<tr><th></th><th>Name</th><th>Collection</th></tr>')
        if (data._embedded) {
            data._embedded.galleries.forEach(function (gallery) {
                var row = $('<tr></tr>').attr('data-uri', gallery._links.self.href);

                row.append($('<td></td>').append(
                    $('<input type="radio" name="gallery">').click(function () {
                        currentGallery = gallery;
                    })
                ));

                row.append($('<td></td>').text(gallery.description));

                var nestedTable = $('<table></table>');
                nestedTable.append('<tr><th>Filename</th><th>Image</th></tr>');
                galleryRepository.getItems(gallery).done(function (data) {
                    if (data._embedded) {
                        data._embedded.items.forEach(function (item) {
                            var row = $('<tr></tr>').attr('data-uri', item._links.self.href);
                            row.append($('<td></td>').text(item.name));
                            row.append($('<td></td>').append(
                                $('<img>').addClass('thumbnail').attr('src', item.image)
                            ));
                            row.append($('<td></td>').append(
                                $('<button>Remove</button>').click(function () {
                                    removePicByResource(item, gallery);
                                })
                            ));
                            nestedTable.append(row);
                        });
                    }
                });

                row.append($('<td></td>').append(nestedTable));

                table.append(row);
            });
        }
        $('#gallery').append(table);
    }

    function drawImageTable(data) {
        var table = $('<table></table>');
        table.append('<tr><th>Filename</th><th>Image</th><th></th><th></th></tr>');
        if (data._embedded) {
            data._embedded.items.forEach(function (item) {
                var row = $('<tr></tr>').attr('data-uri', item._links.self.href);

                row.append($('<td></td>').text(item.name));

                row.append($('<td></td>').append(
                    $('<img>').addClass('thumbnail').attr('src', item.image)
                ));

                row.append($('<td></td>').append(
                    $('<button>Delete</button>').click(function () {
                        deletePic(item);
                    })
                ));

                row.append($('<td></td>').append(
                    $('<button>Add To Gallery</button>').click(function () {
                        addToSelectedGallery(item);
                    })
                ));

                table.append(row);
            });
        }
        $('#images').append(table);
    }

    $(function () {
        $('#file').change(function () {
            readImage(this);
        });

        $('#upload').submit(function (e) {
            e.preventDefault();
            itemRepository.create({
                name: name,
                image: bytes
            }).done(function () {
                window.location.reload();
            })
        });

        galleryRepository.findAll().done(drawGalleryTable);

        itemRepository.findByGalleryIsNull().done(drawImageTable);

    });

})();
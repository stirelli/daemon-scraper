var cheerio = require('cheerio');

var Parser = function () {};

Parser.prototype.defaults = {
    meta: [
        ['description','name',     'description'],
        ['description','property', 'og:description'],
        ['description','property', 'pinterestapp:about'],
        ['image','property', 'og:image'],
        ['image','itemprop', 'image'],
        ['title','property', 'og:title'],
        ['video','property', 'og:video'],
        ['video_type','property', 'og:video:type'],
        ['video_width','property', 'og:video:width'],
        ['video_height','property', 'og:video:height']
    ],
    findLogo         : false,
    findDescription  : true,
    matchNoData      : true,
    multipleImages   : true,
    defaultProtocol  : 'http://',
    minWidth         : 100,
    minHeight        : 32,
    logoWord         : 'logo'
};

//TODO: Preview Obj should be initialized on every request
Parser.prototype.options = {
    url: {},
    preview: {
        url : '',
        images: [],
        image : '',
        title: '' ,
        description: ''
    },
    already: []
};

Parser.prototype.getPreview = function(data, uri)
{
    var that = this;
    var $ = cheerio.load(data);

    that.options.already.push(uri);

    var title  = "" ;

    $(data, '<head>').find('title').each(function()
    {
        title = $(this).text();
    });

    that.options.preview.title       = ( title || uri);
    that.options.preview.url         = uri;

    $(data, '<head>').find('meta').each(function()
    {
        that.setMetaData($(this));
    });

    //if(that.defaults.findDescription && !that.hasValue('description')) {
    //    $(data, '<body>').find('p').each(function()
    //    {
    //        var text = $.trim($(this).text());
    //        if(text.length > 3) {
    //            that.options.preview.description = text;
    //            return false;
    //        }
    //    });
    //}

    //if(core.hasValue('image') && !core.isValidaImage(preview.image)) {
    //    preview.image = '';
    //}

    if (!that.hasValue('image')) {
        // meta tag has no images:

        var images = $(data, '<body>').find('img');

        if (that.defaults.findLogo) {
            images.each(function()
            {
                var self = $(this);

                if (self.attr('src') && self.attr('src').search(that.defaults.logoWord, 'i')  != -1 ||
                    self.attr('id' ) && self.attr('id' ).search(that.defaults.logoWord, 'i')  != -1 ||
                    this.className   &&   this.className.search(that.defaults.logoWord, 'i')  != -1
                ) {
                    that.options.preview.image = $(this).attr('src');
                    return false;
                }

            });
        }


        if (!that.hasValue('image') && images.length > 0 ) {
            images.each(function()
            {
                if(isValidaImage($(this).attr('src'))) {
                    that.options.preview.images.push($(this).attr('src'));
                }
            });
        }
    }

    // prepare output
    var not   = 'undefined';
    var data  = {
        title       : that.options.preview.title,
        description : that.options.preview.description,
        url         : that.options.preview.url,
        video       : (typeof that.options.preview.video != not && that.options.preview.video.length > 0) ? {} : null
    };

    if (data.video != null) {
        data.video = {
            file  :   that.options.preview.video,
            type  : (typeof that.options.preview.video_type   != not) ? that.options.preview.video_type  : '',
            width : (typeof that.options.preview.video_width  != not) ? that.options.preview.video_width : '',
            height: (typeof that.options.preview.video_height != not) ? that.options.preview.video_height :''
        }
    }

    //if (that.hasValue('image')){
    //    preview.images.push(that.options.preview.image);
    //    preview.image = '';
    //}

    //core.addImages();
};

Parser.prototype.setMetaData = function(val)
{
    for (var index in this.defaults.meta) {
        var meta = this.defaults.meta[index];
        this.options.preview[meta[0]] = (getValue(val,meta[1],meta[2])|| this.options.preview[meta[0]] );
    }
};

//Parser.prototype.addImages = function()
//{
//    var that = this;
//    var images = [];
//
//    for (var index in that.options.preview.images) {
//        var image = that.options.preview.images[index];
//
//        if (!isAbsolute(image)) {
//            var pLink    = new $.urlHelper.UriParser(that.options.preview.url);
//            var host     = pLink.url + pLink.subdomain + pLink.domain;
//
//            if (isPathAbsolute(image))
//                image = host + image;
//            else image = host + $.urlHelper.stripFile(pLink.path) + '/' + image;
//        }
//
//        core.getImage(image, function(img)
//        {
//            if (img.width  >= o.minWidth  &&
//                img.height >= o.minHeight && core.preview) {
//
//                o.addImage(img);
//
//                if(!o.multipleImages) {
//                    return;
//                }
//
//            }
//        });
//    }
//
//};

Parser.prototype.hasValue = function(section){
    return (this.options.preview[section].length !== 0);
};

//TODO: FIX uriParser to work properly
//var uriParser =  function (uri) {
//    var regExp      = new RegExp('/^((\w+):\/\/\/?)?((\w+):?(\w+)?@)?([^\/\?:]+)?(:\d+)?(.*)?/');
//    var regExpHost  = new RegExp('/^(.+\.)?(.+\..+)$/');
//
//    var _getVal = function(r, i) {
//        if(!r) return null;
//        return (typeof(r[i]) == 'undefined' ? "" : r[i]);
//    };
//
//    var parse = function(uri) {
//        var r          = regExp.exec(uri);
//        var results         = r;
//        results.url       = _getVal(r,1);
//        results.protocol  = _getVal(r,2);
//        results.username  = _getVal(r,4);
//        results.password  = _getVal(r,5);
//        results.domain    = _getVal(r,6);
//        results.port      = _getVal(r,7);
//        results.path      = _getVal(r,8);
//
//        var rH         = regExpHost.exec( results.domain );
//        this.subdomain = _getVal(rH,1);
//        this.domain    = _getVal(rH,2);
//        return r;
//    };
//
//    if(uri) parse(uri);
//};

var getValue = function(val,key, tag) {
    if (val.attr(key)) {
        if (val.attr(key).toLowerCase() ==  tag.toLowerCase()) {
            if (val.attr('content') && val.attr('content').length > 0) {
                return val.attr('content');
            }
        }

    }
};

var isValidaImage = function(image) {
    return (image.indexOf('.php?') === -1);
};

var isPathAbsolute = function(path) {
    if (path && path.substr(0,1) == '/') return true;
};

var isAbsolute = function(path) {
    var expression = /^(https?:)?\/\//i;
    var value = false;
    if (path)
        value =  (path.match(expression) != null) ? true: false;

    return value;
};

module.exports = Parser;
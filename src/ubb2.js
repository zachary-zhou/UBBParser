/**
 * UBB与html的转换库
 * @author mzhou
 * @version 0.2
 * @log 0.1 完成HTMLtoUBB方法
 *      0.2 完成UBBtoHTML
 */


/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global $:false */

var UBB = (function () {
    'use strict';
    var Tree = {
            clone: function(node, withChildNode) {
                if (!withChildNode) {
                    withChildNode = node;
                    node = this;
                }

                if (!node.isNode) {
                    return null;
                }
                if (withChildNode) {
                    var i,l,
                        newNode = node.clone();
                    for (i=0,l=node.length; i<l; i++) {
                        if (node[i].isNode) {
                            newNode.append(node[i].clone(true));
                        }
                    }
                    return newNode;
                } else {
                    return Tree.createNode(node.name, node.attr);
                }
            },
            append: function(father, son) {
                if (!son) {
                    son = father;
                    father = this;
                }
                if (!son) {
                    return father;
                }
                if (son.parent) {
                    throw 'Node ' + son.name + ' has a parent node!';
                }
                father.push(son);
                son.parent = father;
                return father;
            },
            /*
            detach: function(node) {
                if (!node) {
                    node = this;
                }
                if (node.parent) {
                    var i, l, flag,
                        p = node.parent;
                    for (i=0,l=p.length; i<l; i++) {
                        if (p[i] === node) {
                            flag = true;
                        }
                        if (flag) {
                            p[i] = p[i+1];
                        }
                    }
                    if (flag) {
                        // pop last undefined element
                        // make sure length was right
                        p.pop();
                    }
                    node.parent = null;
                }
                return node;
            },
            */
            getDeepestChild: function(node) {
                var next;
                while (next = node[node.length-1]) {
                    node = next;
                }
                return node;
            },
            createNode: function(name, attr) {
                var n = [];
                n.isNode = true;
                n.append = Tree.append;
                n.clone = Tree.clone;
                // n.detach = Tree.detach;
                if (name) {
                    n.name = name;
                }
                if (attr) {
                    n.attr = attr;
                }
                return n;
            }
        },
        ubbTagNameReg = /\[(\/)?([a-zA-Z]+)/,
        tagsParser = {
            // lowerCase tag name
            bold: {
                /**
                 * parse html node to UBB text
                 * @param {string} nodeName nodeName
                 * @param {object} node jquery object
                 * @param {string} sonString the ubb text of node's children
                 * @param {object} setting
                 * @return {string} ubb text of node and it's children
                 */
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === '#text') {
                        var container = node.parent();
                        if (Util.isBold(container.css('font-weight'))) {
                            return '[bold]'+sonString+'[/bold]';
                        }
                    }
                },
                /**
                 * parse UBB text to HTML text
                 * @param {object} node object represent ubb tag.
                 *                     eg:
                 *                         tree node
                 *                         string tag: 'This is a text'; (It's not contains '\n')
                 *                         \n tag: '\n'.
                 * @param {string} sonString
                 * @param {object} setting
                 * @return {string} html text
                 */
                parseUBB: function(node, sonString, setting) {
                    return '<b>' + sonString + '</b>';
                },
                // string.
                // Specified which tag can be contained.
                // '' or undefined indicate it can't contian any tag.
                // '*' indicate it can contian any tag.
                canContains: 'bold,italic,color,url,image',
                // bool.
                // If true, then this tag can contains '\n'.
                canWrap: 0,
                // bool.
                // If true, then the '\n' right after this tag should be ignore.
                isBlock: 0,
                noAttr: 1
            },
            italic: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === '#text') {
                        var container = node.parent();
                        if (Util.isItalic(container.css('font-style'))) {
                            return '[italic]'+sonString+'[/italic]';
                        }
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return '<i>' + sonString + '</i>';
                },
                canContains: 'bold,italic,color,url,image',
                canWrap: 0,
                isBlock: 0,
                noAttr: 1
            },
            color: {
                parseHTML: function(nodeName, node, sonString, setting) {
                    if (nodeName === '#text') {
                        var color,
                            container = node.parent();
                        color = Util.RGBtoHEX(container.css('color'));
                        if (color && color !== setting.defaultColor && !(container[0].nodeName.toLowerCase() === 'a' && color === setting.linkDefaultColor)) {
                            return '[color='+color+']'+sonString+'[/color]';
                        }
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return '<span style="color:'+(node.attr ? node.attr.slice(1) : '')+';">' + sonString + '</span>';
                },
                canContains: 'bold,italic,color,url,image',
                canWrap: 0,
                isBlock: 0,
                noAttr: 0
            },
            url: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === 'a') {
                        return '[url href='+node.attr('href')+']'+sonString+'[/url]';
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    var i, t, l,
                        href = node.attr ? node.attr.replace(/^\ href\=/, '') : '';
                    if (!node.attr) {
                        // for [url]http://www.guokr.com/question/[bold]265263[/bold]/[/url]
                        for (i=0,l=node.length; i<l; i++) {
                            t = node[i];
                            if (typeof t === 'string') {
                                href += t;
                            }
                        }
                    }
                    return '<a href="'+href+'">' + sonString + '</a>';
                },
                canContains: 'bold,italic,color,url,image',
                canWrap: 0,
                isBlock: 0,
                noAttr: 0
            },
            image: {
                parseHTML: function(nodeName, node) {
                    if (nodeName === 'img' && !node.data('src')) {
                        return '[image]'+node.attr('src')+'[/image]';
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return sonString ? ('<img src="'+sonString+'"/>') : '';
                },
                canWrap: 0,
                isBlock: 0,
                noAttr: 1
            },
            video: {
                parseHTML: function(nodeName, node) {
                    var src;
                    if (nodeName === 'img' && (src = node.data('src'))) {
                        return '[video]'+src+'[/video]';
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return sonString ? ('<img class="gui-ubb-flash" data-src="'+sonString+'" src="'+setting.flashImage+'" width="480" height="400"/>') : '';
                },
                canWrap: 0,
                isBlock: 0,
                noAttr: 1
            },
            flash: {
                parseUBB: function(node, sonString, setting) {
                    return sonString ? ('<img class="gui-ubb-flash" data-src="'+sonString+'" src="'+setting.flashImage+'" width="480" height="400"/>') : '';
                },
                canWrap: 0,
                isBlock: 0,
                noAttr: 1
            },
            blockquote: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === 'blockquote') {
                        return '[blockquote]'+sonString+'[/blockquote]';
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return '<blockquote>' + sonString + '</blockquote>';
                },
                canContains: '*',
                canWrap: 1,
                isBlock: 1,
                noAttr: 1
            },
            ul: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === 'ul') {
                        return '[ul]\n'+sonString+'\n[/ul]';
                    }
                    // in IE <= 7, node is block
                    if (nodeName === 'li' && !Util.isBlock(node)) {
                        var parent = node.parent()[0];
                        // if its parent is ul and it's not the last node
                        if (parent && parent.nodeName.toLowerCase() === 'ul' && node.next().length) {
                            return sonString + '\n';
                        }
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    var i = 0,
                        strs = sonString.split('<br/>'),
                        j = strs[0] ? 0 : 1,
                        l = strs[strs.length-1] ? 0 : -1,
                        newStrs = [];
                    l += strs.length;
                    for (; j<l; i++, j++) {
                        newStrs[i] = strs[j];
                    }
                    return '<ul><li>' + newStrs.join('</li><li>') + '</li></ul>';
                },
                canContains: '*',
                canWrap: 1,
                isBlock: 1,
                noAttr: 1
            },
            ol: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === 'ol') {
                        return '[ol]\n'+sonString+'\n[/ol]';
                    }
                    // in IE <= 7, node is block
                    if (nodeName === 'li' && !Util.isBlock(node)) {
                        var parent = node.parent()[0];
                        // if its parent is ul and it's not the last node
                        if (parent && parent.nodeName.toLowerCase() === 'ol' && node.next().length) {
                            return sonString + '\n';
                        }
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    var i = 0,
                        strs = sonString.split('<br/>'),
                        j = strs[0] ? 0 : 1,
                        l = strs[strs.length-1] ? 0 : -1,
                        newStrs = [];
                    l += strs.length;
                    for (; j<l; i++, j++) {
                        newStrs[i] = strs[j];
                    }
                    return '<ol><li>' + newStrs.join('</li><li>') + '</li></ol>';
                },
                canContains: '*',
                canWrap: 1,
                isBlock: 1,
                noAttr: 1
            },
            ref: {
                parseHTML: function(nodeName, node, sonString) {
                    if (nodeName === 'div' && node[0].className === 'gui-ubb-ref') {
                        return '[ref]'+sonString+'[/ref]';
                    }
                },
                parseUBB: function(node, sonString, setting) {
                    return '<div class="gui-ubb-ref">' + sonString + '</div>';
                },
                canWrap: 0,
                isBlock: 1,
                noAttr: 1
            }
        },
        // cache for closeTag
        closeTagCache = {},
        // cache for startTag
        startTagCache = {},
        blockStype = {
            'block': 1,
            'table': 1,
            'table-cell': 1,
            'table-caption': 1,
            'table-footer-group': 1,
            'table-header-group': 1,
            'table-row': 1,
            'table-row-group': 1
        },
        Util = {
            /**
             * if node is block a line.
             * @param {object} node jquery object
             * @return {boolean}
             */
            isBlock: function(node) {
                return blockStype[node.css('display')];
            },
            /**
             * if fontWeight is bold
             * @param {string} fontWeight
             * @return {boolean}
             */
            isBold: function(fontWeight) {
                var number = parseInt(fontWeight, 10);
                if(isNaN(number)) {
                    return (/^(bold|bolder)$/).test(fontWeight);
                } else {
                    return number > 400;
                }
            },
            /**
             * if fontStyle is italic
             * @param {string} fontStyle
             * @return {boolean}
             */
            isItalic: function(fontStyle) {
                return (/^(italic|oblique)$/).test(fontStyle);
            },
            /**
             * change RGB to HEX
             * @param {string} oldColor rbg color
             * @return {string} hex color
             */
            RGBtoHEX: function ( oldColor ) {
                var i,
                    RGB2HexValue = '',
                    numbers,
                    regExp = /([0-9]+)[, ]+([0-9]+)[, ]+([0-9]+)/,
                    array = regExp.exec(oldColor);
                if (!array) {
                    if ( oldColor.length === 4 ) {
                        numbers = oldColor.split('').slice(1);
                        RGB2HexValue = '#';
                        for ( i=0; i<3; i++ ) {
                            RGB2HexValue += numbers[i]+numbers[i];
                        }
                    } else {
                        RGB2HexValue = oldColor;
                    }
                } else {
                    for (i = 1; i < array.length; i++) {
                        RGB2HexValue += ('0' + parseInt(array[i], 10).toString(16)).slice(-2);
                    }
                    RGB2HexValue = '#' + RGB2HexValue;
                }
                return RGB2HexValue;
            },
            ubbEscape: function(str) {
                return str.replace(/(\[|\])/g, '\\$1');
            },
            prevNode: function(node) {
                var prev = node.previousSibling,
                    text;
                if (prev) {
                    text = prev.data;
                    if ($.trim(text) === '' || text === '\n') {
                        return Util.nextNode(prev);
                    } else {
                        return prev;
                    }
                }
            },
            nextNode: function(node) {
                var next = node.nextSibling,
                    text;
                if (next) {
                    text = next.data;
                    if ($.trim(text) === '' || text === '\n') {
                        return Util.nextNode(next);
                    } else {
                        return next;
                    }
                }
            },
            /**
             * parse jquery node to ubb text
             * @param {object} node jquery object
             * @param {string} sonString the ubb text of node's children
             * @param {object} setting
             * @return {string} ubb text of node and it's children
             */
            parseNode: function(node, sonString, setting, blockContext) {
                var tagName, tagParser, tmp, addNewLineLater,
                    next, prev,
                    nodeType = node[0].nodeType,
                    nodeName = node[0].nodeName.toLowerCase();
                // comments
                if (nodeType === 8) {
                    return;
                }
                // text
                if (nodeType !== 3) {
                    // node是block元素，并且它不是父元素的最后一个节点
                    if (Util.isBlock(node) && (node.height() > 0) && !(Util.isBlock(node.parent()) && !Util.nextNode(node[0]))) {
                        addNewLineLater = true;
                    }
                    if (nodeName === 'br') {
                        prev = Util.prevNode(node[0]);
                        next = Util.nextNode(node[0]);
                        if (Util.isBlock(node.next()) || Util.isBlock(node.next()) || !(prev && !next)) {
                            sonString = sonString + '\n';
                        }
                    }
                } else {
                    sonString = node.text();
                    if (!setting.keepWhiteSpace) {
                        sonString = $.trim(sonString)
                                     .replace(/\s{2,}/g,' ');
                    }
                    if (!setting.keepNewLine) {
                        sonString = sonString.replace(/\n/g,'');
                    }
                    sonString = Util.ubbEscape(sonString);
                    if (sonString === '') {
                        return;
                    }
                }
                for (tagName in setting.tags) {
                    tagParser = setting.tags[tagName];
                    if (tagParser.parseHTML) {
                        tmp = tagParser.parseHTML(nodeName, node, sonString, setting);
                        if (tmp) {
                            sonString = tmp;
                        }
                    }
                }
                if (addNewLineLater) {
                    sonString = sonString + '\n';
                }
                return sonString;
            },
            /**
             * can father contains son
             * @param {object} father father tag
             * @param {object} son son tag
             * @param {object} ubbTagsOrder prioritys for all tags
             * @return {boolean}
             */
            canContains: function(father, son, ubbTagsOrder) {
                var canContainsTags = ubbTagsOrder[father.name];
                return typeof canContainsTags === 'boolean' ? canContainsTags : canContainsTags[son.name];
            },
            /**
             * push open ubb tag into stack
             * @param {array} node
             * @param {object} tag tags to be push
             * @param {object} ubbTagsOrder
             */
            pushOpenUbbTag: function(node, tag, ubbTagsOrder) {
                var autoClosedNode;
                while (!node.isRoot && !Util.canContains(node, tag, ubbTagsOrder)) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                node.append(tag);
                // if has autoClosedNode and tag can contains them, then complete immediately
                if (autoClosedNode && Util.canContains(tag, autoClosedNode, ubbTagsOrder)) {
                    tag.append(autoClosedNode);
                    return Tree.getDeepestChild(autoClosedNode);
                // or complete later
                } else {
                    return tag;
                }
            },
            /**
             * push close ubb tag into stack
             * @param {array} node
             * @param {string} tagName
             */
            pushCloseUbbTag: function(node, tagName) {
                var autoClosedNode;
                while (!node.isRoot && node.name !== tagName) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                if (node.isRoot) {
                    // ignore this tag
                    return node;
                } else {
                    // autoClose
                    node = node.parent;
                    node.append(autoClosedNode);
                    return autoClosedNode ? Tree.getDeepestChild(autoClosedNode) : node;
                }
            },
            /**
             * push '\n'
             * @param {object} node
             * @param {object} wrapUbbTags canWrap value
             */
            pushLineUbbTag: function(node, wrapUbbTags) {
                var autoClosedNode;
                while (!node.isRoot && !wrapUbbTags[node.name]) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                node.append('\n');
                // if can contains then complete immediately
                node.append(autoClosedNode);
                return autoClosedNode ? Tree.getDeepestChild(autoClosedNode) : node;
            },
            /**
             * html encode
             * @param {string} str html string
             * @return {string} encoded html string
             */
            htmlEncode: function (str) {
                if (str) {
                    str = str.replace(/&/igm, '&amp;');
                    str = str.replace(/</igm, '&lt;');
                    str = str.replace(/>/igm, '&gt;');
                    str = str.replace(/\"/igm, '&quot;');
                }
                return str;
            },
            /**
             * scan ubb text into tag list
             * @param {string} text ubb text
             * @param {object} ubbTagsOrder
             * @param {object} wrapUbbTags
             * @return {array} tag list
             */
            scanUbbText: function(text, setting) {
                // encode html
                text = Util.htmlEncode(text);
                text = text.replace(/\r\n/g, '\n'); // for IE hack
                var c, r, tagName, tag, prevOpenTag, attr, isClose,
                    ubbTagsOrder = setting.ubbTagsOrder,
                    wrapUbbTags = setting.wrapUbbTags,
                    // state value represent next char not be escape
                    NOESCAPE = 0,
                    // state value represent next char should be escape
                    ESCAPE = 1,
                    // state value
                    state = NOESCAPE,
                    j = 0,
                    i = 0,
                    l = text.length,
                    buf = '',
                    root = Tree.createNode(),
                    node = root;
                // mark root
                root.isRoot = true;
                for(; i<l; i++) {
                    c = text.charAt(i);
                    switch(c) {
                    case '\\':
                        state = ESCAPE;
                        break;
                    case '[':
                        if (state === ESCAPE) {
                            buf += '[';
                            state = NOESCAPE;
                        } else {
                            if (buf) {
                                node.append(buf);
                            }
                            buf = '[';
                        }
                        break;
                    case ']':
                        if (state === ESCAPE) {
                            buf += ']';
                            state = NOESCAPE;
                        } else {
                            r = ubbTagNameReg.exec(buf);
                            // is tag
                            if (r && r[2] && ((tagName = r[2].toLowerCase()) in ubbTagsOrder)) {
                                // new tag
                                isClose = !!r[1];
                                if (!isClose) {
                                    attr = buf.slice(r[2].length + (r[1] ? 2 : 1));
                                    tag = Tree.createNode(tagName, attr);
                                }

                                // close
                                if (isClose) {
                                    node = Util.pushCloseUbbTag(node, tagName);
                                // open
                                } else {
                                    node = Util.pushOpenUbbTag(node, tag, ubbTagsOrder);
                                }
                            // not tag
                            } else {
                                node.append(buf + ']');
                            }
                            buf = '';
                        }
                        break;
                    case '\n':
                        if (state === ESCAPE) {
                            state = NOESCAPE;
                        }
                        if (buf) {
                            node.append(buf);
                            buf = '';
                        }
                        node = Util.pushLineUbbTag(node, wrapUbbTags);
                        break;
                    default:
                        if (state === ESCAPE) {
                            state = NOESCAPE;
                        }
                        buf += c;
                        break;
                    }
                }
                if (buf) {
                    node.append(buf);
                }

                return root;
            },
            /**
             * parse ubb node to ubb text
             * @param {object} node ubb node
             * @param {string} sonString the ubb text of node's children
             * @param {object} setting
             * @param {object} state
             * @return {string} html text of node and it's children
             */
            parseUbbNode: function(node, sonString, setting, state) {
                var tagsParser = setting.tags,
                    tagInfo;
                if (node === '\n') {
                    if (state.nobr) {
                        state.nobr = false;
                        return '';
                    } else {
                        return '<br/>';
                    }
                } else if (typeof node === 'string') {
                    state.nobr = false;
                    return node;
                } else if ((tagInfo = tagsParser[node.name]) && tagInfo.parseUBB) {
                    if (tagInfo.isBlock) {
                        state.nobr = true;
                    }
                    return tagInfo.parseUBB(node, sonString, setting);
                }
            },
            /**
             * fix ubb node to ubb text
             * @param {object} node ubb node
             * @param {string} sonString the ubb text of node's children
             * @param {object} setting
             * @return {string} ubb text of node and it's children
             */
            fixUbbNode: function(node, sonString, setting) {
                if (typeof node === 'string') {
                    return Util.ubbEscape(node);
                } else {
                    return '['+node.name+(node.attr || '')+']'+sonString+'[/'+node.name+']';
                }
            }
        },
        /**
         * parse jquery node into html
         * @param {object} node jquery object, must be a block element
         * @param {object} setting
         * @param {object} parent jquery object
         * @return {string} ubb text
         */
        parseHtml = function(node, setting, state) {
            var i,l,isBlock,
                re = [],
                children = node.contents();
            state = state || {};
            if (Util.isBlock(node)) {
                state.blockContext = node;
                isBlock = true;
            }
            for (i=0,l=children.length; i<l; i++) {
                re.push(parseHtml(children.eq(i), setting, state));
                // reset blockContext
                if (isBlock) {
                    state.blockContext = node;
                }
            }
            // make sure container not to be parsed
            if (state.blockContext) {
                return Util.parseNode(node, re.join(''), setting, state.blockContext);
            } else {
                return re.join('');
            }
        },
        /**
         * parse ubb text into html text
         * @param {object} node
         * @param {object} setting
         * @param {object} state
         * @return {string} html text
         */
        parseUbb = function(node, setting, state) {
            var i, l,
                re = [];
            state = state || {};

            if (node.isNode) {
                for (i=0,l=node.length; i<l; i++) {
                    re.push(parseUbb(node[i], setting, state));
                }
            }

            // root node has no meaning
            if (!node.isRoot) {
                return Util.parseUbbNode(node, re.join(''), setting, state);
            } else {
                return re.join('');
            }
        },
        /**
         * auto complete ubb string
         * fix error placed tags
         * @param {object} node
         * @param {object} setting
         * @param {object} state
         * @return {string} fixed ubb string
         */
        fixUbb = function(node, setting, state) {
            var i, l,
                re = [];
            state = state || {};

            if (node.isNode) {
                for (i=0,l=node.length; i<l; i++) {
                    re.push(fixUbb(node[i], setting, state));
                }
            }

            // root node has no meaning
            if (!node.isRoot) {
                return Util.fixUbbNode(node, re.join(''), setting, state);
            } else {
                return re.join('');
            }
        };

    /**
     *  var ubbParser = new UBB();
     *  @param {object} setting
     */
    function UBB(setting) {
        this.setting = $.extend({
                            // color of all text element
                            defaultColor: '#000000',
                            // color of a elment
                            linkDefaultColor: '#006699',
                            // if keep white space in html text when converting
                            keepWhiteSpace: true,
                            // if keep new line space in html text when converting
                            keepNewLine: false,
                            // flash image to show
                            flashImage: '/skin/imgs/flash.png'
                       }, setting);
        this.setting.tags = $.extend(tagsParser, this.setting.tags);
        this.setting.ubbTagsOrder = {};
        this.setting.wrapUbbTags = {};
        var k, v, i, l, tagNames, order;
        setting = this.setting;
        for (k in setting.tags) {
            v = setting.tags[k];
            switch (v.canContains) {
            case '*':
                setting.ubbTagsOrder[k] = true;
                break;
            case '':
                setting.ubbTagsOrder[k] = false;
                break;
            case undefined:
                setting.ubbTagsOrder[k] = false;
                break;
            default:
                tagNames = v.canContains.split(',');
                order = {};
                for (i=0,l=tagNames.length; i<l; i++) {
                    order[tagNames[i].toLowerCase()] = true;
                }
                setting.ubbTagsOrder[k] = order;
                break;
            }
            setting.wrapUbbTags[k] = v.canWrap;
        }
    }
    UBB.Util = Util;
    /**
     * @param {object} $dom jquery, must be a block element
     * @return {string} ubb text
     */
    UBB.prototype.HTMLtoUBB = function ($dom) {
        return parseHtml($dom, this.setting);
    };
    /**
     * @param {string} ubb text
     * @return {string} html text
     */
    UBB.prototype.UBBtoHTML = function(ubb) {
        return parseUbb(Util.scanUbbText(ubb, this.setting), this.setting);
    };
    /**
     * fix error ubb text
     * @param {string} ubb text
     * @return {string} fixed ubb text
     */
    UBB.prototype.fixUBB = function(ubb) {
        return fixUbb(Util.scanUbbText(ubb, this.setting), this.setting);
    };
    return UBB;
})();

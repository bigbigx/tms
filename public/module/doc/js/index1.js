/**
 * Created by linxin on 2017/6/26.
 */
var $window = $(window),
    $nav = $('#nav'),
    $menuBtn = $('.nav-menu-button'),
    $search = $('.search-input'),
    $searchClose = $('.search-close'),
    $list_ul = $('.list-content-ul'),               // 笔记列表
    $list_box = $('.list-content'),                 // 笔记列表盒子
    $doc_box = $('.doc-content');                   // 笔记详情盒子

// 自动保存时间
var AUTO_TIME = 60 * 1000,
    NEW_TITLE = '新建笔记';
var host = window.location.host,
    g_id = null,                // 定义一个全局id 用来存储当前操作目录的id
    $g_folder = null,
    niceScroll = null,
    mdeditor = null,            // md 编辑器
    wangeditor = null,          // wangeditor 编辑器
    timeId = null,
    cur_note = null,
    local_note = null,
    sort_type = localStorage.getItem('sort_type') || 'updated_at',  // 排序类型
    sort_order = localStorage.getItem('sort_order') || 'desc',      // 排序方式
    // share_title = null,          分享标题
    isCtrlS = false,            // 是否按了Ctrl-S
    cur_page = 1,               // 当前笔记列表的页码
    totalPage = null,           // 笔记列表总页码
    isSearch = false,           // 是否为搜索结果列表
    isNewest = false,           // 是否为最新笔记列表
    isRecycle = false,          // 是否为回收站列表
    isLoading = false;          // 是否正在加载列表

switch (host) {
    case 'stip.omwteam.com':
        host = 'http://stip.omwteam.com';
        break;
    case '172.28.2.228':
        host = 'http://172.28.2.228/stip/public';
        break;
    case '127.0.0.1:8000':
        host = 'http://127.0.0.1:8000';
        break;
}
var folder = {
    init: function () {
        folder.navHelper();
        folder.initNav();
        folder.clickHandle();
    },
    // 渲染文件夹列表
    initNav: function () {

        var tpl = $('#nav-tpl').html();
        var list = [];
        $.get(host + '/group/list', function (res) {
            // var html = template('group-tpl', {list: list, idx: 0, active: list[0].id});
            var html = template('group-tpl', {group: res.data});
            $('.nav-newest-item').after(html);

            $nav.niceScroll({
                cursorcolor: '#aaa',
                autohidemode: 'scroll',
                horizrailenabled: false,
                cursorborder: '0'
            });
            note.getNewList();
            note.init();
        });
    },
    navHelper: function () {
        template.helper('renderNav', function (data) {
            if(data.length){
                for (var i = 0; i < data.length - 1; i++) {
                    for (var j = 1; j < data.length; j++) {
                        if (data[i].id === data[j].p_id) {
                            if (!data[i].child) {
                                data[i].child = []
                            }
                            data[i].child.push(data[j]);
                        }
                    }
                }
                var list = [];
                for (i = 0; i < data.length; i++) {
                    (data[i].p_id === 0) ? list.push(data[i].p_id) : null;
                }
                return template('nav-tpl',{list: list, idx: 0});
            }
        })
    },
    clickHandle: function () {
        var $layout = $('#layout'),

            $newDocBtn = $('.new-doc-box'),
            $addDir = $('.add-dir'),
            $input = $('.child-item-input input'),
            $firstParent = $('.first-menu-a.is-parent');
        // 收起侧边栏
        $menuBtn.on('click', function () {
            var isEdit = $doc_box.hasClass('is-edit-1');
            if (isEdit) {
                var $code = $('.CodeMirror'),
                    $preview = $('.editormd-preview'),
                    width = $code.width();
            }
            if ($layout.hasClass('middle')) {
                $layout.removeClass('middle');
                $menuBtn.removeClass('right');
                $firstParent.data('switch', 'on').siblings('ul').slideDown(300);
                if (isEdit) {
                    $code.animate({'width': width - 100}, 300);
                    $preview.animate({'width': width - 100}, 300);
                }
                folder.navScrollResize();
            } else {
                $layout.addClass('middle');
                $menuBtn.addClass('right');
                $firstParent.data('switch', 'off').siblings('ul').slideUp(300);
                if (isEdit) {
                    $code.animate({'width': width + 100}, 300);
                    $preview.animate({'width': width + 100}, 300);
                }
            }
        });
        if ($window.width() < 1200) {
            $menuBtn.click();
        }
        $window.resize(function () {
            var $self = $(this);
            if (($self.width() < 1200 && !$layout.hasClass('middle')) || ($self.width() > 1200 && $layout.hasClass('middle'))) {
                $menuBtn.click();
                folder.navScrollResize();
            }
        });

        // 点击新建文档事件
        $newDocBtn.on('click', function (e) {
            e.stopPropagation();
            var $list = $('.add-list');
            if($list.is(':visible')){
                $list.hide();
            }else{
                $('.more-ul').hide();
                $list.show();
            }
            folder.navScrollResize();
            $(document).off('click').one('click', function () {
                $list.hide();
            })
        });

        // 左边栏目录点击事件
        $nav.on('click', '.child-menu-open', function (e) {
            e.stopPropagation();
            var self = $(this).parent(),
                ul_switch = self.data('switch');
            if (ul_switch == 'on') {
                self.data('switch', 'off').removeClass('on').siblings('ul').slideUp(300);
            } else {
                self.data('switch', 'on').addClass('on').siblings('ul').slideDown(300);
            }
            folder.navScrollResize();
        })
        // 点击我的文档目录事件
            .on('click', '.nav-doc-a', function () {
                var self = $(this),
                    ul_switch = self.data('switch');
                if ($layout.hasClass('middle')) {
                    $layout.removeClass('middle');
                    $menuBtn.removeClass('right');
                    self.data('switch', 'on').addClass('on').siblings('ul').slideDown(300);
                } else {
                    if (ul_switch == 'on') {
                        self.data('switch', 'off').removeClass('on').siblings('ul').slideUp(300);
                    } else {
                        self.data('switch', 'on').addClass('on').siblings('ul').slideDown(300);
                    }
                }
                folder.navScrollResize();
            })
            .on('click', '.second-menu-a', function () {
                var $self = $(this);
                g_id = $self.data('id');
                $('.child-item.active,.pure-menu-item').removeClass('active');
                $self.parent().addClass('active');
                cur_page = 1;
                isRecycle = isNewest = isSearch = false;
                $search.val('');
                note.getList(g_id);
            })
            // 点击下拉菜单
            .on('click', '.child-menu-down', function (e) {
                e.stopPropagation();
                var scrollTop = $nav.getNiceScroll(0).getScrollTop();
                var $self = $(this),
                    idx = $self.data('idx'),
                    $downBox = $('.down-box'),
                    $downIcon = $('.child-menu-down');

                g_id = $self.parent().data('id');
                $g_folder = $self.parent().parent();

                if (!$self.hasClass('active')) {
                    $downIcon.removeClass('active');
                    $self.addClass('active');
                    $downBox.fadeIn(200).css('top', e.pageY - e.offsetY - 150 + scrollTop);
                    // 如果是第四级目录，则不给添加子文件夹
                    var $add_p = $('.down-box p[data-type="add"]');
                    if (idx == '4') {
                        $add_p.hide();
                    } else {
                        $add_p.show();
                    }
                    // 点击其他地方则隐藏下拉框
                    $(document).one("click", function () {
                        $downBox.fadeOut(200);
                        $downIcon.removeClass('active');
                    });
                } else {
                    $self.removeClass('active');
                    $downBox.fadeOut(200);
                    $g_folder = null;
                }
            })
            // 选中下拉菜单事件
            .on('click', '.down-box p', function (e) {
                e.stopPropagation();
                var $self = $(this),
                    type = $self.data('type'),
                    id = $self.data('id'),
                    $icon = $('.child-menu-down.active'),
                    elem = $icon.parent().parent(), text = null,
                    idx = parseInt($icon.data('idx'));
                $self.parent().hide();
                $icon.removeClass('active');

                switch (type) {
                    // 新建子文件夹
                    case 'add':
                        text = $('#add-input-tpl').html().replace('##idx##', idx + 1);
                        if (elem.find('.child-list').length === 0) {
                            elem.append('<ul class="child-list">' + text + '</ul>');
                        } else {
                            elem.children('.child-list').append(text);
                        }
                        // 监听输入框失去焦点和回车事件
                        elem.find('ul input').focus().on('blur keypress', function (e) {
                            var $self = $(this),
                                value = $self.val(),
                                $menu_a = $self.parent().parent();
                            if (e.keyCode === 13) {
                                $self.off('blur');
                            } else if (e.type !== 'blur') {
                                return;
                            }
                            if (value && value.length < 13) {
                                $.post(host + '/folder/add', {
                                    title: value,
                                    p_id: g_id
                                }, function (res) {
                                    if (res.code === 200) {
                                        layer.msg('添加成功');
                                        var tag = $self.parent().parent().parent().parent().prev('a');
                                        $self.parent().html(value);
                                        if (!tag.hasClass('is-parent')) {
                                            tag.addClass('is-parent on').data('switch', 'on');
                                        }
                                        $menu_a.removeClass('last-menu-a')
                                            .addClass('second-menu-a')
                                            .data({'id': res.data.id, 'pid': res.data.p_id});
                                        $menu_a = null;
                                    } else if (res.code === 403) {
                                        layer.msg(res.msg);
                                        $menu_a.parent().remove();
                                        $menu_a = null;
                                    }
                                })
                            } else {
                                if (value.length > 12) {
                                    layer.msg('文件夹名称不能超过12个字符');
                                }
                                $menu_a.parent().remove();
                                $menu_a = null;
                            }
                        });
                        break;
                    // 文件夹重命名
                    case 'rename':
                        var pid = $icon.parent().data('pid');
                        elem = $icon.parent().find('.item-name');
                        text = elem.text();
                        elem.html('<input type="text" value="' + text + '">')
                            .find('input').focus().on('blur keypress', function (e) {
                            var $self = $(this),
                                value = $self.val();
                            if (e.keyCode === 13) {
                                $self.off('blur');
                            } else if (e.type !== 'blur') {
                                return;
                            }
                            if (value && value !== text && value.length < 13) {
                                $.post(host + '/folder/update', {
                                    title: value,
                                    id: g_id,
                                    pid: pid
                                }, function (res) {
                                    if (res.code === 200) {
                                        elem.html(value);
                                        layer.msg('修改成功');
                                    } else {
                                        elem.html(text);
                                        layer.msg(res.msg);
                                    }
                                })
                            } else {
                                if (value.length > 12) {
                                    layer.msg('文件夹名称不能超过12个字符');
                                }
                                elem.html(text);
                            }
                        }).on('click', function (e) {
                            e.stopPropagation();
                        });
                        break;
                    // 删除文件夹
                    case 'del':
                        layer.confirm('删除不可恢复，是否确定删除？', {
                            btn: ['确定', '取消']
                        }, function () {
                            main.delFolder();
                        });
                        break;
                }
            })
            //打开回收站
            .on('click', '.nav-del-item', function () {
                $(this).addClass('active').siblings().removeClass('active');
                $('.child-item.active').removeClass('active');
                $doc_box.addClass('null');
                cur_page = 1;
                isRecycle = true;
                isSearch = isNewest = false;
                note.getRecycle();
            })
            // 打开最新笔记
            .on('click', '.nav-newest-item', function () {
                $(this).addClass('active').siblings().removeClass('active');
                $('.child-item.active').removeClass('active');
                note.getNewList();
            });

        // 新建文件夹
        $addDir.on('click', function () {
            $(this).prev('.child-item-input').show().find('input').focus();
        });
        // 我的文档下级新建文件夹输入框失去焦点时或回车触发
        $input.on('blur keypress', function (e) {
            var $self = $(this);
            if (e.keyCode === 13) {
                $self.off('blur keypress');
            } else if (e.type !== 'blur') {
                return;
            }
            folder.addFirstFolder($self);
            $self.on('focus', function () {
                $self.off('blur keypress').on('blur keypress', function (e) {
                    var $self = $(this);
                    if (e.keyCode === 13) {
                        $self.off('blur keypress');
                    } else if (e.type !== 'blur') {
                        return;
                    }
                    folder.addFirstFolder($self);
                })
            })
        });
    },
    // 我的文档下级新建文件夹事件
    addFirstFolder: function (self) {
        var value = self.val();
        if (value) {
            $.post(host + '/folder/add', {title: value, p_id: 0}, function (res) {
                if (res.code === 200) {
                    var list = [
                        {
                            id: res.data.id,
                            title: value,
                            p_id: 0,
                            currentCount: 0,
                            totalCount: 0
                        }
                    ];
                    var html = template('nav-tpl', {list: list, idx: 0});
                    $('.child-item-input').before(html);
                } else {
                    layer.msg(res.msg);
                }
            })
        }
        self.val('').parent().hide();
    },
    navScrollResize: function () {
        setTimeout(function () {
            $nav.getNiceScroll().resize();
        }, 300);
    }
};

var note = {
    init: function () {
        note.clickListEvent();
        var $sortLi = $('.sort-down-menu li');
        $sortLi.each(function () {
            var $self = $(this);
            if ($self.data('type') === sort_type) {
                $self.addClass('active ' + sort_order);
            }
        });
    },
    // 获取最新笔记
    getNewList: function () {
        isNewest = true;
        isSearch = isRecycle = false;
        $.get(host + '/note/latest', function (res) {
            isLoading = false;
            if (res.code === 200) {
                if (res.data.length) {
                    $doc_box.removeClass('null');
                    $list_box.removeClass('null is-search-null');
                    var html = template('list-tpl', {list: res.data, active: res.data[0].id});
                    $list_ul.html(html);
                    niceScroll ? $list_box.getNiceScroll().resize() : note.scorllHandle();
                    note.getNoteDetail(res.data[0].id);
                } else {
                    $doc_box.addClass('null');
                    $list_box.addClass('null').removeClass('is-search-null');
                    $list_ul.html('');
                    mdeditor && mdeditor.clear();
                }
            }
        })
    },
    // 加载笔记列表
    getList: function (folder_id) {
        $.get(host + '/note/show', {
            id: folder_id,
            field: sort_type,
            order: sort_order,
            page: cur_page
        }, function (res) {
            isLoading = false;
            if (res.code === 200) {
                if (res.data.data.length) {
                    $doc_box.removeClass('null');
                    $list_box.removeClass('null is-search-null');
                    var html = null;
                    if (cur_page === 1) {
                        html = template('list-tpl', {list: res.data.data, active: res.data.data[0].id});
                        $list_ul.html(html);
                        note.scorllHandle();
                        note.getNoteDetail(res.data.data[0].id);
                        totalPage = res.data.totalPage;
                    } else {
                        html = template('list-tpl', {list: res.data.data, active: null});
                        $list_ul.append(html);
                        $list_box.getNiceScroll().resize()
                    }
                    cur_page++;
                } else {
                    if (cur_page === 1) {
                        $doc_box.addClass('null');
                        $list_box.addClass('null').removeClass('is-search-null');
                        $list_ul.html('');
                        mdeditor && mdeditor.clear();
                    }
                }
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 获取回收站列表
    getRecycle: function () {
        $.get(host + '/note/recycle', {
            page: cur_page,
            field: sort_type,
            order: sort_order
        }, function (res) {
            isLoading = false;
            console.log(res);
            if (res.code === 200) {
                if (res.data.data.length) {
                    $list_box.removeClass('null is-search-null');
                    var html = template('recycle-tpl', {list: res.data.data});
                    if (cur_page === 1) {
                        $list_ul.html(html);
                        note.scorllHandle();
                        totalPage = res.data.totalPage;
                    } else {
                        $list_ul.append(html);
                        $list_box.getNiceScroll().resize()
                    }
                    cur_page++;
                } else {
                    if (cur_page === 1) {
                        $doc_box.addClass('null');
                        $list_box.addClass('null').removeClass('is-search-null');
                        $list_ul.html('');
                        mdeditor && mdeditor.clear();
                    }
                }
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 搜索功能
    getSearch: function () {
        var value = $search.val();
        if (!value.trim()) {
            return false;
        }
        $.get(host + '/note/search', {
            keywords: value,
            type: $('.search-type').data('type'),
            field: sort_type,
            order: sort_order,
            page: cur_page
        }, function (res) {
            isLoading = false;
            if (res.code === 200) {
                if (res.data.data.length) {
                    $doc_box.removeClass('null');
                    $list_box.removeClass('null is-search-null');
                    var html = null;
                    if (cur_page === 1) {
                        html = template('list-tpl', {list: res.data.data, active: res.data.data[0].id});
                        $list_ul.html(html);
                        note.scorllHandle();
                        note.getNoteDetail(res.data.data[0].id);
                        totalPage = res.data.totalPage;
                    } else {
                        html = template('list-tpl', {list: res.data.data, active: null});
                        $list_ul.append(html);
                        $list_box.getNiceScroll().resize()
                    }
                    cur_page++;
                } else {
                    if (cur_page === 1) {
                        $doc_box.addClass('null');
                        $list_box.addClass('null is-search-null');
                        $list_ul.html('');
                        mdeditor && mdeditor.clear();
                    }
                }
            }
        })
    },
    // 显示笔记内容
    getNoteDetail: function (note_id) {
        $.get(host + '/note/find', {id: note_id, active: isRecycle ? '0' : '1'}, function (res) {
            if (res.code === 200) {
                $doc_box.removeClass('null');
                $('.doc-preview-body').html(res.data.content)
                    .on('click', 'img', function () {
                        var $self = $(this),
                            json = {
                                "title": "",
                                "id": 123,
                                "start": 0,
                                "data": [
                                    {
                                        "alt": "",
                                        "pid": 666,
                                        "src": $self.attr('src'),
                                        "thumb": ""
                                    }
                                ]
                            };
                        // 查看大图
                        layer.photos({
                            photos: json
                            , anim: 5
                        });
                    });
                $doc_box.removeClass('is-edit is-edit-1 is-edit-2 null').addClass('no-edit');
                clearInterval(timeId);
                timeId = null;
                $('.doc-title-span').html(res.data.title);
                res.data.lock ? $('.list-lock').show() : $('.list-unlock').show();
                cur_note = res.data;
                mdeditor && mdeditor.clear();
                if (isRecycle) {
                    $doc_box.addClass('is-recycle');
                } else {
                    $doc_box.removeClass('is-recycle');
                }
            } else {
                layer.msg(res.msg);
                $('.doc-item.active').remove();
                $doc_box.addClass('null');
            }
        })
    },
    // 监听事件
    clickListEvent: function () {
        var $searchType = $('.search-type'),
            $searchTypeUl = $('.search-type-ul')
            $moreList = $('.more-list'),
            $itemMore = null;
        // 点击列表
        $list_ul.on('click', '.doc-item', function () {
            var $self = $(this);
            if (!$self.hasClass('active')) {
                $self.addClass('active').siblings().removeClass('active');
                var note_id = $self.data('id');
                $doc_box.hasClass('is-edit') ? note.saveNote() : null;
                note.getNoteDetail(note_id);
            }
        });
        // 点击列表删除功能
        $moreList.on('click', '.list-del', function (e) {
            e.stopPropagation();
            var elem = $('.doc-item.active'),
                note_id = cur_note.id;
            layer.confirm('是否确定删除？', {
                btn: ['确定', '取消']
            }, function () {
                note.delNote(note_id, elem);
            });
        });
        // 点击列表上锁功能
        $moreList.on('click', '.list-lock', function (e) {
            e.stopPropagation();
            var $self = $(this), _id = cur_note.id;
            $.post(host+'/note/lockNote', {id: _id}, function (res) {
                if(res.code === 200){
                    $self.hide().next('.list-unlock').show();
                    layer.msg('上锁成功，其他人无法进行操作');
                }else{
                    layer.msg(res.msg);
                }
            })
        });
        // 点击列表解锁功能
        $moreList.on('click', '.list-unlock', function (e) {
            e.stopPropagation();
            var $self = $(this), _id = cur_note.id;
            $.post(host+'/note/unlockNote', {id: _id}, function (res) {
                if(res.code === 200){
                    $self.hide().prev('.list-lock').show().parent().hide();
                    layer.msg('解锁成功，其他人可以进行操作');
                }else{
                    layer.msg(res.msg);
                }
            })
        });
        // 点击列表还原功能
        $list_ul.on('click', '.list-restore-icon', function (e) {
            e.stopPropagation();
            var elem = $(this).parent().parent(),
                note_id = elem.data('id');
            note.restoreNote(note_id, elem);
        });
        // 点击列表分享图标
        // $list_ul.on('click', '.list-share-icon', function (e) {
        //     e.stopPropagation();
        //     var elem = $(this).parent().parent(),
        //         note_id = elem.data('id'),
        //         title = elem.find('.list-title-text').text();
        //     $('.mask,.share-dialog').show();
        //     var g_url = window.location.href;
        //     $('.share-copy-c input').val(g_url);
        //     new ZeroClipboard(document.getElementById("btnCopy"));
        //
        //     share_title = title + ' -- 来自云笔记';
        //
        //     $('.share-close').on('click', function () {
        //         $('.mask,.share-dialog').hide();
        //         $(this).off('click');
        //     })
        // });
        // 选择排序方式
        $('.sort-down-menu li').on('click', function () {
            if (isNewest) {
                layer.msg('最新笔记不需要排序哦！');
                return '';
            }
            if (isRecycle) {
                layer.msg('回收站不需要排序哦！');
                return '';
            }
            var $self = $(this),
                type = $self.data('type');
            if (type === sort_type) {
                if ($self.hasClass('desc')) {
                    $self.addClass('asc').removeClass('desc');
                    sort_order = 'asc';
                } else {
                    $self.addClass('desc').removeClass('asc');
                    sort_order = 'desc';
                }
            } else {
                sort_type = type;
                if ($self.hasClass('desc')) {
                    $self.addClass('active asc').removeClass('desc').siblings().removeClass('active');
                    sort_order = 'asc';
                } else {
                    $self.addClass('active desc').removeClass('asc').siblings().removeClass('active');
                    sort_order = 'desc';
                }
            }
            cur_page = 1;
            isSearch ? note.getSearch() : (isRecycle ? note.getRecycle() : note.getList(g_id));
        });
        // 监听搜索框回车事件
        $search.on('keydown', function (e) {
            if (e.keyCode === 13) {
                cur_page = 1;
                isSearch = true;
                isRecycle = isNewest = false;
                note.getSearch();
            }
        })
            .on('cut paste', function () {
                var $self = $(this);
                setTimeout(function () {
                    $self.val().trim() ? $searchClose.show() : '';
                }, 0)
            })
            .on('input', function () {
                var $self = $(this);
                $self.val().trim() ? $searchClose.show() : '';
            });
        // 搜索类型事件
        $searchType.on('click', function (e) {
            e.stopPropagation();
            if ($searchTypeUl.is(':visible')) {
                $searchTypeUl.hide();
            } else {
                $('.more-ul').hide();
                $searchTypeUl.show();
                $(document).off('click').one('click', function () {
                    $searchTypeUl.hide();
                })
            }
        });
        // 选择搜索类型
        $searchTypeUl.on('click', 'li', function () {
            var $self = $(this),
                type = $self.data('type'),
                text = $self.text();
            $searchType.data('type', type).text(text);
            $searchTypeUl.hide();
        });
        // 关闭搜索事件
        $searchClose.on('click', function () {
            $searchClose.hide();
            $search.val('');
            if (isSearch) {
                isSearch = false;
                cur_page = 1;
                if ($('.nav-newest-item').hasClass('active')) {
                    isNewest = true;
                    note.getNewList();
                } else if ($('.nav-del-item').hasClass('active')) {
                    isRecycle = true;
                    note.getRecycle();
                } else {
                    isRecycle = isNewest = false;
                    note.getList(g_id);
                }
            }
        });
        // 标题失去焦点事件
        $('.doc-title-span').on('blur', function () {
            note.saveTitle();
        });
        // 点击更多按钮
        $('.more-btn').on('click', function (e) {
            e.stopPropagation();
            var $moreList = $('.more-list');
            if ($moreList.is(':visible')) {
                $moreList.hide();
            } else {
                $('.more-ul').hide();
                $moreList.show();
                $(document).off('click').one('click', function () {
                    $moreList.hide();
                })
            }
        });
        // 切换主题
        $('.editor-theme li').on('click', function (e) {
            e.stopPropagation();
            var $self = $(this),
                theme = $self.text();
            $self.addClass('active').siblings().removeClass('active');
            mdeditor.setEditorTheme(theme);
            localStorage.setItem('editor_theme', theme);
        })

    },
    // 笔记列表滚动事件
    scorllHandle: function () {
        if (!isNewest) {
            $list_box.on('scroll', function () {
                var ul_height = $list_ul.height(),
                    box_height = $list_box.height();
                if (totalPage >= cur_page && $list_box.scrollTop() + box_height > ul_height - 50 && !isLoading) {
                    isLoading = true;
                    isSearch ? note.getSearch() : (isRecycle ? note.getRecycle() : note.getList(g_id));
                }
            });
        }

        niceScroll = $list_box.niceScroll({
            cursorcolor: '#aaa',
            autohidemode: 'leave',
            horizrailenabled: false,
            cursorborder: '0'
        });
    },
    // 初始化编辑器
    initEditor: function (type, value) {
        var height = $window.height() - $('.doc-content-header').outerHeight() - 65;
        if (type === '1') {
            if (!!mdeditor) {
                value ? mdeditor.setMarkdown(value) : mdeditor.clear();
            } else {
                mdeditor = editormd("editormd", {
                    path: "./libs/editormd/lib/",
                    width: '100%',
                    height: height,
                    markdown: value || '',
                    disabledKeyMaps: ["Ctrl-S"],
                    taskList: true,
                    tocm: true,
                    codeFold: true,
                    tex: true,
                    flowChart: true,
                    sequenceDiagram: true,
                    searchReplace: true,
                    imageUpload: true,
                    imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
                    imageUploadURL: "./common/mdEditorUpload",
                    toolbarIcons: function () {
                        return ["undo", "redo", "|", "bold", "del", "italic", "quote", "hr", "|", "h1", "h2", "h3",
                            "|", "list-ul", "list-ol", "link", "table", "datetime", "clear", "image", "code-block", "preview", "fullscreen", "search",  "theme"
                        ]
                    },
                    toolbarIconsClass:{
                        search: '',  fullscreen: '', preview: '', image: '', 'code-block': ''

                    },
                    toolbarIconTexts: {
                        theme: '切换主题 ', search: '搜索',  fullscreen: '全屏', preview: '预览',
                        image: '上传图片', 'code-block': '插入代码'
                    },
                    toolbarHandlers: {
                        theme: function () {
                            var $theme = $('.editor-theme'),
                                $document = $(document);
                            if ($theme.hasClass('active')) {
                                $theme.removeClass('active');
                                $document.off('click');
                            } else {
                                $theme.addClass('active');
                                $document.one('click', function () {
                                    $theme.removeClass('active');
                                })
                            }
                        }
                    },
                    onload: function () {
                        var keyMap = {
                            "Ctrl-S": function (cm) {
                                note.ctrlSNote();
                            }
                        };
                        this.addKeyMap(keyMap);
                        $('.editor-theme li').each(function (index, item) {
                            var $self = $(this),
                                theme = localStorage.getItem('editor_theme') || 'default',
                                text = $self.text();
                            if (theme === text) {
                                $self.addClass('active');
                                mdeditor.setEditorTheme(theme);
                            }
                        })
                    }
                });
            }
        } else if (type === '2') {
            if (!!wangeditor) {
                wangeditor.txt.html(value || '');
            } else {
                wangeditor = new wangEditor('#editor');
                wangeditor.customConfig.uploadImgServer = './common/wangEditorUpload';
                wangeditor.customConfig.uploadFileName = 'image-file';
                wangeditor.create();
                wangeditor.txt.html(value || '');
                $('.w-e-text-container').height(height - 41);
                $('.w-e-text').keydown(function (e) {
                    if (e.ctrlKey == true && e.keyCode == 83) {
                        note.ctrlSNote();
                        return false;
                    }
                });
            }

        }

        timeId = setInterval(note.autoSaveNote, AUTO_TIME);
    },
    // 新建笔记
    newNote: function (type) {
        type = type || '1';
        if (!g_id) {
            layer.msg('新建笔记需要先选择目录哦！');
            return false;
        }
        $.post(host + '/note/add', {
            title: NEW_TITLE,
            f_id: g_id,
            type: type
        }, function (res) {
            if (res.code === 200) {
                $('.doc-item.active').removeClass('active');
                var list = [res.data];
                var html = template('list-tpl', {list: list, active: res.data.id});
                $list_ul.prepend(html);
                $('.doc-item.active').addClass('is-edit');
                $doc_box.removeClass('null no-edit').addClass('is-edit is-edit-' + type);
                $list_box.removeClass('null');
                $('.doc-title-input').val('');
                $('.doc-title-span').html(res.data.title);
                $('.doc-preview-body').html(res.data.content || '');
                // var $count = $('.child-item.active>.second-menu-a>.item-count');
                // main.navCountHandle($count);
                cur_note = res.data;
                note.initEditor(type);
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 删除笔记
    delNote: function (note_id, elem) {
        $.post(host + '/note/del', {id: note_id}, function (res) {
            if (res.code === 200) {
                layer.msg('删除成功');
                elem.remove();
                clearInterval(timeId);
                timeId = null;
                if (!$('.doc-item.active').length) {
                    $doc_box.addClass('null');
                }
                if (!$list_ul.find('.doc-item').length) {
                    $list_box.addClass('null');
                }
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 还原已删笔记
    restoreNote: function (note_id, elem) {
        var id = note_id || cur_note.id,
            e = elem || $('.doc-item.active');
        $.post(host + '/note/recovery', {id: id}, function (res) {
            if (res.code === 200) {
                layer.msg('还原笔记成功');
                e.remove();
                $doc_box.addClass('null');
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 编辑笔记
    editNote: function () {
        $('.doc-title-input').val(cur_note.title);
        $doc_box.removeClass('no-edit').addClass('is-edit is-edit-' + cur_note.type);
        $('.doc-item.active').addClass('is-edit');
        cur_note.type === '1' ? note.initEditor('1', cur_note.origin_content) : note.initEditor(cur_note.type, cur_note.content);
    },
    // 保存笔记
    saveNote: function () {
        var title = $('.doc-title-input').val().trim() || cur_note.title,
            md_cnt = cur_note.type === '1' ? mdeditor.getMarkdown().trim() : '',
            html_cnt = cur_note.type === '1' ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim(),
            note_id = cur_note.id;

        if (cur_note.title == title && (cur_note.content || '') == html_cnt) {
            $doc_box.removeClass('is-edit is-edit-1 is-edit-2').addClass('no-edit');
            return false;
        }
        $.post(host + '/note/update', {
            id: note_id,
            f_id: cur_note.f_id,
            title: title,
            content: html_cnt,
            origin_content: md_cnt
        }, function (res) {

            if (res.code === 200) {
                $('.doc-item.is-edit').removeClass('is-edit').find('.list-title-text').text(res.data.title);
                layer.msg('保存成功');
                $('.doc-preview-body').html(html_cnt);
                $doc_box.removeClass('is-edit is-edit-1 is-edit-2').addClass('no-edit');
                clearInterval(timeId);
                timeId = null;
                $('.doc-title-span').html(res.data.title);
                cur_note = res.data;
                local_note = null;
                localStorage.removeItem('local_note');
                main.unbindUnload();
            } else if (res.code === 403) {
                layer.msg(res.msg);
            }
        })
    },
    // ctrl-s 保存笔记
    ctrlSNote: function () {
        if (!isCtrlS) {
            var title = $('.doc-title-input').val().trim() || cur_note.title,
                md_cnt = cur_note.type === '1' ? mdeditor.getMarkdown().trim() : '',
                html_cnt = cur_note.type === '1' ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim(),
                note_id = cur_note.id;
            if (cur_note.title == title && (cur_note.content || '') == html_cnt) {
                return false;
            }
            isCtrlS = true;
            $.post(host + '/note/update', {
                id: note_id,
                f_id: cur_note.f_id,
                title: title,
                content: html_cnt,
                origin_content: md_cnt
            }, function (res) {
                isCtrlS = false;
                if (res.code === 200) {
                    layer.msg('保存成功');
                    $('.doc-item.is-edit .list-title-text').text(res.data.title);
                    $('.doc-preview-body').html(html_cnt);
                    $('.doc-title-span').html(res.data.title);
                    cur_note = res.data;
                    local_note = null;
                    localStorage.removeItem('local_note');
                    main.unbindUnload();
                } else if (res.code === 403) {
                    layer.msg(res.msg);
                }
            })
        }
    },
    // 自动保存笔记
    autoSaveNote: function () {
        local_note = {};
        for (var i in cur_note) {
            local_note[i] = cur_note[i];
        }
        var title = $('.doc-title-input').val().trim(),
            md_cnt = local_note.type === '1' ? mdeditor.getMarkdown().trim() : '',
            html_cnt = local_note.type === '1' ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim();
        if (local_note.title == title && local_note.content == html_cnt) {
            return false;
        }
        local_note.title = title;
        local_note.origin_content = md_cnt;
        local_note.content = html_cnt;
        localStorage.setItem('local_note', JSON.stringify(local_note));
        main.bindUnload();
        console.log('保存了');
    },
    // 导出PDF
    htmlToPDF: function () {
        var form = document.createElement('form'),
            input = document.createElement('input'),
            textArea = document.createElement('textarea'),
            button = document.createElement('button'),
            tpl = $('#pdf-tpl').html();
        form.action = 'http://tool.omwteam.com';
        form.method = 'post';
        form.target = '_blank';
        input.name = 'title';
        input.value = cur_note.title;
        textArea.name = 'content';
        textArea.value = tpl.replace('##content##', cur_note.content);
        button.type = 'submit';
        button.innerHTML = '提交';
        form.appendChild(input);
        form.appendChild(textArea);
        form.appendChild(button);
        form.style.display = 'none';
        document.body.appendChild(form);
        button.click();
    },
    // 保存标题
    saveTitle: function () {
        var $span = $('.doc-title-span'),
            title = $span.html();
        if (title === cur_note.title) {
            return false;
        } else if (title.length === 0) {
            $span.html(cur_note.title);
            return false;
        }
        $.post(host + '/note/update', {
            id: cur_note.id,
            f_id: cur_note.f_id,
            title: title
        }, function (res) {
            if (res.code === 200) {
                if (cur_note.id === res.data.id) {
                    $('.doc-title-span,.doc-item.active .list-title-text').text(res.data.title);
                    cur_note.title = res.data.title;
                }
            }
        })
    }
};

var main = {
    init: function () {
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            complete: function (XMLHttpRequest) {
                if (XMLHttpRequest.status === 401) {
                    layer.msg('登录信息验证失败，请重新登录', function () {
                        location.href = host + '/login';
                    });
                } else if (XMLHttpRequest.status === 503) {
                    var res = JSON.parse(XMLHttpRequest.responseText);
                    layer.msg(res.msg, function () {
                        location.href = host + '/login';
                    });
                } else if (XMLHttpRequest.status !== 200) {
                    layer.msg('服务器出错了 ' + XMLHttpRequest.status);
                }
            }
        });
        // 禁止保存网站
        $(document).keydown(function (e) {
            if (e.ctrlKey == true && e.keyCode == 83) {
                return false;
            }
        });
        folder.init();
    },
    // 监听窗口关闭
    bindUnload: function () {
        main.unbindUnload();
        $window.bind('beforeunload', function () {
            var localNote = localStorage.getItem('local_note');
            if (localNote) {
                localNote = JSON.parse(localNote);
                layer.msg(localNote.title + ' 还未保存，是否要保存？', {
                    time: 0,
                    btn: ['保存', '不保存'],
                    yes: function () {
                        note.saveNote();
                    },
                    btn2: function () {
                        $doc_box.removeClass('is-edit is-edit-1 is-edit-2').addClass('no-edit');
                        clearInterval(timeId);
                        timeId = null;
                        local_note = null;
                        localStorage.removeItem('local_note');
                        main.unbindUnload();
                    }
                });
                return '您输入的内容尚未保存，确定离开此页面吗？';
            }
        });
    },
    unbindUnload: function () {
        $window.unbind('beforeunload');
    },
    // 删除目录事件
    delFolder: function () {
        $.post(host + '/folder/del', {id: g_id}, function (res) {
            if (res.code === 200) {
                $g_folder.remove();
                layer.msg('删除成功');
            } else {
                layer.msg(res.msg);
            }
        })
    },
    // 目录下笔记数量操作
    navCountHandle: function (elem, type) {
        var text = elem.text().replace('(', '').replace(')', ''),
            idx = text.indexOf('/');
        if (idx === -1) {
            text = parseInt(text) + 1;
            elem.text('(' + text + ')');
            var pElem = elem.parents('.child-list').prev('[data-pid="0"]').eq(0).find('.item-count');
            main.navCountHandle(pElem, true);
        } else {
            var first = type ? parseInt(text.substring(0, idx)) : parseInt(text.substring(0, idx)) + 1,
                last = parseInt(text.substring(idx + 1)) + 1;
            elem.text('(' + first + '/' + last + ')');
        }
    }
};

main.init();

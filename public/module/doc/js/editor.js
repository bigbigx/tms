/**
 * Created by linxin on 2017/8/11.
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        editormd = require('editormd');
        require('wangEditor');

    var $window = $(window),
        $footer_box = $('.doc-content-footer'),         // 笔记附件盒子
        $doc_box = $('.doc-content');                   // 笔记详情盒子
    
    var editor = {
        // 初始化编辑器
        initEditor: function (type, value) {
            require.async([
                "libs/editormd/plugins/link-dialog/link-dialog",
                "libs/editormd/plugins/reference-link-dialog/reference-link-dialog",
                "libs/editormd/plugins/image-dialog/image-dialog",
                "libs/editormd/plugins/code-block-dialog/code-block-dialog",
                "libs/editormd/plugins/table-dialog/table-dialog",
                "libs/editormd/plugins/emoji-dialog/emoji-dialog",
                "libs/editormd/plugins/goto-line-dialog/goto-line-dialog",
                "libs/editormd/plugins/help-dialog/help-dialog",
                "libs/editormd/plugins/html-entities-dialog/html-entities-dialog",
                "libs/editormd/plugins/preformatted-text-dialog/preformatted-text-dialog"
            ]);
            
            var height = $window.height() - $('.doc-content-header').outerHeight() - 65;
            // if($footer_box.hasClass('active')){
            //     if($footer_box.hasClass('on')){
            //         height -= 30;
            //     }else{
            //         height -= 130;
            //     }
            // }
            if (type == 1) {
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
                                "|", "list-ul", "list-ol", "link", "table", "datetime", "clear", "image","file", "code-block", "preview", "fullscreen", "search",  "theme"
                            ]
                        },
                        toolbarIconsClass:{
                            search: '',  fullscreen: '', preview: '', image: '', 'code-block': ''

                        },
                        toolbarIconTexts: {
                            theme: '切换主题 ', search: '搜索',  fullscreen: '全屏', preview: '预览',
                            image: '上传图片', 'code-block': '插入代码', file: '上传附件'
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
                            },
                            file: function () {
                                editor.uploadFile();
                            }
                        },
                        onload: function () {
                            var keyMap = {
                                "Ctrl-S": function (cm) {
                                    editor.ctrlSNote();
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
            } else if (type == 2) {
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
                    var tags = '<div class="w-e-menu w-e-upload" style="z-index:6;padding: 0 10px;line-height: 36px;">上传附件</div>';
                    $('.w-e-toolbar').append(tags);
                    $('.w-e-upload').on('click', function(){
                        editor.uploadFile();
                    })
                }

            }
            clearInterval(timeId);
            timeId = setInterval(editor.autoSaveNote, AUTO_TIME);
        },
        // 上传附件
        uploadFile: function(){
            // 引入 uploader.js
            require.async("./uploader", function  (uploader) {  
                layer.open({
                    type: 1,
                    area: ['800px', '500px'], 
                    title: '上传附件',
                    content: $('#upload-tpl').html()
                });
                uploader();
            })
        },
        // ctrl-s 保存笔记
        ctrlSNote: function () {
            if (!isCtrlS) {
                var title = $('.doc-title-input').val().trim() || cur_note.title,
                    md_cnt = cur_note.type == 1 ? mdeditor.getMarkdown().trim() : '',
                    html_cnt = cur_note.type == 1 ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim(),
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
                        editor.unbindUnload();
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
                md_cnt = local_note.type == 1 ? mdeditor.getMarkdown().trim() : '',
                html_cnt = local_note.type == 1 ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim();
            if (local_note.title == title && local_note.content == html_cnt) {
                return false;
            }
            local_note.title = title;
            local_note.origin_content = md_cnt;
            local_note.content = html_cnt;
            localStorage.setItem('local_note', JSON.stringify(local_note));
            $.post(host + '/note/update', {
                id: local_note.id,
                f_id: local_note.f_id,
                title: title,
                content: html_cnt,
                origin_content: md_cnt
            }, function (res) {
                if (res.code === 200) {
                    cur_note = res.data;
                    local_note = null;
                    editor.unbindUnload();
                    $('.doc-preview-body').html(html_cnt);
                    $('.doc-title-span').html(res.data.title);
                    $('.doc-item.is-edit').find('.list-title-text').text(res.data.title);
                }
            })
            editor.bindUnload();
        },
        // 保存笔记
        saveNote: function (callback) {
            var title = $('.doc-title-input').val().trim() || cur_note.title,
                md_cnt = cur_note.type == 1 ? mdeditor.getMarkdown().trim() : '',
                html_cnt = cur_note.type == 1 ? mdeditor.getPreviewedHTML().trim() : wangeditor.txt.html().trim(),
                note_id = cur_note.id;

            if (cur_note.title == title && (cur_note.content || '') == html_cnt) {
                $doc_box.removeClass('is-edit is-edit-1 is-edit-2').addClass('no-edit');
                callback && callback();
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
                    editor.unbindUnload();
                    callback && callback();
                } else if (res.code === 403) {
                    layer.msg(res.msg);
                }
            })
        },
        // 监听窗口关闭
        bindUnload: function () {
            editor.unbindUnload();
            $window.bind('beforeunload', function () {
                var localNote = localStorage.getItem('local_note');
                if (localNote) {
                    localNote = JSON.parse(localNote);
                    layer.msg(localNote.title + ' 还未保存，是否要保存？', {
                        time: 0,
                        btn: ['保存', '不保存'],
                        yes: function () {
                            editor.saveNote();
                        },
                        btn2: function () {
                            $doc_box.removeClass('is-edit is-edit-1 is-edit-2').addClass('no-edit');
                            clearInterval(timeId);
                            timeId = null;
                            local_note = null;
                            localStorage.removeItem('local_note');
                            editor.unbindUnload();
                        }
                    });
                    return '您输入的内容尚未保存，确定离开此页面吗？';
                }
            });
        },
        unbindUnload: function () {
            $window.unbind('beforeunload');
        }
    };
    module.exports = editor;
});
@extends('layouts.share')

@section('style')
    <link rel="stylesheet" href="{{asset('libs/bootstrap/css/bootstrap.min.css')}}">
    <link rel="stylesheet" href="{{asset('libs/editormd/css/editormd.min.css')}}">
    <link rel="stylesheet" href="{{asset('module/share/css/index.css')}}">
@endsection

@section('content')
<div class="container">
    <div class="row">
        @if (isset($list['attachment'][0]))
        <div class="col-sm-12 col-md-9" style="position: relative;">
        @else
        <div class="col-md-12" style="position: relative;">
        @endif
            <div class="note-wrap-bg"></div>
            <div class="note-wrap">
                @if (isset($list))
                    <script>document.title = "{{$list['title']}}";</script>
                    <div class="note-title">{{$list['title']}}</div>
                    <div class="note-content markdown-body editormd-preview-container">
                        {!! $list['content'] !!}
                    </div>
                    
                @else
                    <div class="note-null">文档不存在或分享链接已取消</div>
                @endif
            </div>
        </div>

        @if (isset($list['attachment'][0]))
        <div class="col-sm-12 col-md-3">
            <div class="note-attachment">
                <div class="note-attachment-title">下载附件</div>
                <ul>
                    @foreach($list['attachment'] as $item)
                    <li><a href="{{$item['url']}}" download="{{$item['name']}}">{{$item['name']}}</a></li>
                    @endforeach
                </ul>
            </div>
        </div>
        @endif
        
    </div>
</div>
    <!-- <div class="note-wrap-bg @if (isset($list['attachment'][0])) note-small @endif"></div>
    <div class="note-wrap">
        @if (isset($list))
            <script>document.title = "{{$list['title']}}";</script>
            <div class="note-title">{{$list['title']}}</div>
            <div class="note-content markdown-body editormd-preview-container">
                {!! $list['content'] !!}
            </div>
            
        @else
            <div class="note-null">文档不存在或分享链接已取消</div>
        @endif

    </div>
    @if (isset($list['attachment'][0]))
    <div class="note-attachment">
        <div class="note-attachment-title">下载附件</div>
        <ul>
            @foreach($list['attachment'] as $item)
            <li><a href="{{$item['url']}}" download="{{$item['name']}}">{{$item['name']}}</a></li>
            @endforeach
        </ul>
    </div>
    @endif -->
    <div class="footer">
        软件团队技术文档平台提供
    </div>

    
@endsection
@section('script')
<script>
    var $$ = mdui.JQ;
    var winHeight = $$(window).height();
    $$('.note-wrap-bg').css('minHeight',winHeight-150+'px');
</script>
@endsection
    $(document).on('ready', function () {
        
        $('#close').on('click', function () {
            $('.msgbox').addClass('hidden');
        });
        
        $('#eula').on('click', function () {
            $('.msgbox').removeClass('hidden');
        });
        
        $('#btnLogin').on('click', function () {
            $.post('/do_login', {
                username: $('#username').val(),
                password: $('#password').val()
            }, function (data) {
                if (data === 'OK') {
                    alert('登陆成功');
                    location.href = '/index';
                } else {
                    alert('登陆失败,请检查用户名和密码是否正确');
                }
            });
        });
        
        $('body').keypress(function (e) {
            if (e.which == 13) {
                $('#btnLogin').click();
            }
        });
        
        $('#btnReg').on('click', function () {
            if ($('#password').val() != $('#pwd2').val()) {
                alert('两次输入的密码相同');
                return ;
            }
            if ($('#password').val() === '' || $('#username').val() === '') {
                alert('有东西没填好吧....');
                return ;
            }
            $.post('/do_reg', {
                username: $('#username').val(),
                password: $('#password').val()
            }, function (data) {
                if (data === 'OK') {
                    alert('注册成功,现在将跳转到登陆页面');
                    location.href = '/login'
                } else {
                    alert('注册失败，用户名可能已被使用');
                }
            });
        });
        
        $('#logout').on('click', function () {
            $.get('/do_logout', function (data) {
                if (data === 'OK') {
                    alert('注销成功');
                    location.reload();
                } else {
                    alert('注销失败');
                }
            });
        });
        
        $('#submitReply').on('click', function () {
            console.log('OK');
            $.post('/do_addReply', {
                'pid' : $('#pid').val(),
                'content': $('#replyContent').val()
            }, function (data) {
                if (data === 'OK') {
                    location.reload();
                } else if (data === 'login_required') {
                    alert('你登陆了吗?');
                } else {
                    alert('提交失败');
                }
            });
        });
        
        $('#addNewPost').on('click', function () {
            if ($('#title').val() == '') {
                alert('标题不能为空！');
                return ;
            }
            $.post('/do_addPost', {
                'title' : $('#title').val(),
                'content' : $('#content').val()
            }, function (data) {
                if (data === 'OK') {
                    location.reload();
                } else if (data === 'login_required') {
                    alert('你登陆了吗?');
                } else {
                    alert('提交失败');
                }
            });
        });
        
        $('#uploadIcon').on('click', function () {
            $(this).html('上传中');
            $(this).attr({
                'disabled': 'disabled'
            });
            console.log('uploading');
            var data = new FormData();
            var file = $('#uploader')[0].files[0];
            data.append('file-0', file);
            $.ajax({
                url: '/do_uploadIcon',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST',
                success: function(data){
                    location.reload();
                }
            });
        });
        
        $(document).bind('mousemove', function(e) {
            var py = parseInt(e.pageY);
            console.log(py);
            if (py <= 70) {
                console.log('gogogo');
                $('#headerBar').addClass('show');
                $('#headerBar-fake').addClass('show');
            } else {
                $('#headerBar').removeClass('show');
                $('#headerBar-fake').removeClass('show');
            }
        });
    
    });
(function() {
    $('document').ready(function() {
        $.get('/hotpost', function(data) {
            console.log(data);
            var s = '';
            for (var i = 0; i < data.length; i++) {
                s += '<a href="/post?id=' + data[i].pid + '" target="_blank">' + data[i].title + '</a><br/>';
            }
            $('#hotpostList').html(s);
        });
        
        $.get('/hotuser', function(data) {
            $('#hotuserList').html(data);
        });
    });
})();
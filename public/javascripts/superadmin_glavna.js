function tweet() {
    let tekst = document.getElementById('tweetTextArea').value;
    if (tekst.length) {
        $.ajax({
            url: '/tweet',
            method: 'POST',
            data: {sadrzaj: tekst},
            success: function () {
                document.getElementById('tweetTextArea').value = '';
            }
        });
    }
}

function zatvoriNoviTweet() {
    document.getElementById('tweetTextArea').value = '';
}
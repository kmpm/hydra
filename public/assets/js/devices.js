

function bind_stream_btn(stream_id){
  $('#' + stream_id +  ' .btn').on("click", function(event){
    event.preventDefault();
    alert("submit");
  });
}

function loadStreamHtml(){
  $('.load-html').each(function(){
    var t = $(this);
    var stream_id = t.data('stream');
    var url = "./" + stream_id;
    t.load(url, function(responseText, textStatus, xhr){
      console.log(arguments);
      bind_stream_btn(stream_id);
    });
  });
}
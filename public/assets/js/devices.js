
$(document).ready(function(){
  loadTable();
  $('.refresh').on('click', loadTable);
});


function loadTable(){
  $('#devices').html('<img src="/assets/images/ajax-loader.gif">');
  $('#devices').load(document.location.href, 
      {fields:"_id name streams._id streams.name streams.cv streams.raw streams.unit streams.last_cv streams.status"}
    );
}

$.fn.serializeObject = function()
{
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
};

function bind_stream_btn(stream_id){
  $("div[data-stream='" + stream_id + "'] form").on("submit", function(event){
    event.preventDefault();
    $this = $(this);
    
    $.post($this.attr('action'), $this.serialize(), function(data){
      window.location.reload();
    });
  });
}

function loadStreamHtml(device_id){
  $('.load-html').each(function(){
    var t = $(this);
    var stream_id = t.data('stream');
    var url = views.streams.prefix + stream_id + "?" + $.param({device_id:device_id});
    t.load(url, function(responseText, textStatus, xhr){
      bind_stream_btn(stream_id);
    });
  });
}


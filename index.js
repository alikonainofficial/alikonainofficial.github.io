
  $(document).ready(function(){
    $("#video-button").click(function(){
      var iframe = document.createElement('iframe');
      iframe.width = "420";
      iframe.height = "315";
      iframe.src = "https://www.youtube.com/embed/ncR1eq8gFZU?autoplay=1";
      iframe.allow = "autoplay";
      $("#profile-image").attr('src', "images/evilflowey.png").fadeIn('fast');
      $("#title-greeting").toggleClass("title-greeting");
      $("#title-greeting").text("You asked for it.");
      setTimeout(function(){
        $("#title-greeting").toggleClass("title-greeting");
        $("#profile-image").remove();
        document.getElementById("video-button").appendChild(iframe);
      }, 3500);
    });
    var date = new Date()
    $("#cpdate").text(date.getFullYear());
  });

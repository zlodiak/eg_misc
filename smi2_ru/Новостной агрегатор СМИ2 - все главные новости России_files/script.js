$(function() {

    var App = {

        init: function() {
            App.Menu();
            App.Scrolls();

        },
        Menu: function(){
            $('.menu-btn, .mp-overlay').click(function(){
                $('.container-all').toggleClass('menu-opened');
            });

        },
        Scrolls: function(){
            $(".left-column-inner").mCustomScrollbar({
                scrollbarPosition: "outside",
                theme: "light-thin"
            });
            $(".right-column-inner").mCustomScrollbar({
                scrollbarPosition: "outside",
                theme: "dark-thin"
            });
        }
    }

    $(function() {
        App.init();
    });
});
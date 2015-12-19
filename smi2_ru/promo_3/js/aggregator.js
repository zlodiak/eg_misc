var Aggregator = {
    snap: null,

    articlesParams: {
        offset: 0,
        limit: 20
    },

    messages: {
        weekdayNames: [
            'Ð’Ð¾ÑÐºÑ€ÐµÑÐµÐ½ÑŒÐµ', 'ÐŸÐ¾Ð½ÐµÐ´ÐµÐ»ÑŒÐ½Ð¸Ðº', 'Ð’Ñ‚Ð¾Ñ€Ð½Ð¸Ðº', 'Ð¡Ñ€ÐµÐ´Ð°', 'Ð§ÐµÑ‚Ð²ÐµÑ€Ð³', 'ÐŸÑÑ‚Ð½Ð¸Ñ†Ð°', 'Ð¡ÑƒÐ±Ð±Ð¾Ñ‚Ð°'
        ]
    },

    articlesIds: [],

    init: function () {
        Aggregator.initArticles();
        Aggregator.initArticlesParams();
        Aggregator.initTopics();
        Aggregator.initTime();
        Aggregator.initWeather();
        Aggregator.initExchangeRates();
        Aggregator.initInfinityScroll();
        Aggregator.initUpdate();
        Aggregator.initExtensionPopup();

        $('body')
            .on('click', '.article', function (e) {
                //e.preventDefault();

                var $this = $(this),
                    $topBlock = $('#top-block'),
                    articleId = $this.data('id');

                $('.article-full').hide();
                $('.article').show();

                $this.hide();
                $('#af' + articleId).show();
                Aggregator.setBanner();

                $('body').scrollTo('#af' + articleId, 500, {offset: -($topBlock.height() + (parseInt($topBlock.css('top')) || 0))});

                if (history && history.pushState) {
                    history.pushState(null, null, '?article=' + articleId);
                }

                Aggregator.initSocial(articleId);
                Aggregator.changeTitle($('.title', $this).text());
            })
            .on('click', '.social', function (e) {
                e.preventDefault();

                var $this = $(this),
                    social = $this.data('social'),
                    $block = $this.closest('.social-block'),
                    $article = $this.closest('.article-full');

                var a = {
                    title: $('.article-title', $article).text(),
                    announce: $('.article-announce', $article).text(),
                    img_url: $block.data('social-image')
                };

                if (Share[social] !== undefined) {
                    Share[social]($block.data('social-link'), a.title, a.img_url, a.announce);
                }
            })
            .on('click', '#articles-loading.loading', function (e) {
                e.preventDefault();
            })
            .on('click', '#refresh-block', function (e) {
                //Aggregator.refreshArticles();
                window.location.href = location.href;
            });

            Aggregator.initMainArticle();
    },

    initUpdate: function () {
        Visibility && Visibility.every(60 * 1000, function () {
            var params = $.extend({}, Aggregator.articlesParams);
            params.offset = 0;
            params.only_ids = 1;

            Aggregator.loadArticles(params, function (articles) {
                var newArticlesIds = [];

                $.each(articles, function () {
                    if (-1 === Aggregator.articlesIds.indexOf(this.id)) {
                        newArticlesIds.push(this.id);
                    }
                });

                Aggregator.updateRefreshBlock(newArticlesIds.length);
            });

        });
    },

    updateRefreshBlock: function (count) {
        var $block = $('#refresh-block'),
            $count = $('#refresh-new-count'),
            $comment = $('#refresh-new-comment'),
            $topBlock = $('#top-block'),
            comment = $comment.data('five');

        if (!count) {
            $block.hide();
        }
        else {
            var GetNoun = function (number, one, two, five) {
                number = Math.abs(number);
                number %= 100;

                if (number >= 5 && number <= 20) {
                    return five;
                }

                number %= 10;
                if (number == 1) {
                    return one;
                }
                if (number >= 2 && number <= 4) {
                    return two;
                }

                return five;
            };

            $count.text(count);
            $comment.text(GetNoun(count, $comment.data('one'), $comment.data('two'), $comment.data('five')));
            $block.show();
        }

        $('#content-block').css({paddingTop: ($topBlock.height() + (parseInt($topBlock.css('top')) || 0)) + 'px'});
    },

    initInfinityScroll: function () {
        $(window).scroll(function () {
            if (document.body.scrollHeight <= (document.documentElement.scrollTop || document.body.scrollTop) + $(window).height() + 300) {
                Aggregator.appendArticles();
            }
        });

        if (!Aggregator.isHeigthScroll()) {
            Aggregator.appendArticles();
        }
    },

    initArticles: function () {
        Aggregator.articlesIds = [];

        $('.article').each(function () {
            Aggregator.articlesIds.push(
                $(this).data('id')
            );
        });
    },

    initArticlesParams: function () {
        var search = $('#articles-loading').attr('href').match(/\?(.+)/)[1];

        Aggregator.articlesParams = JSON.parse(
            '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}'
        );
    },

    initMainArticle: function () {
        var $mainArticle = $('.article-main');

        if ($mainArticle.length) {
            Aggregator.initSocial($mainArticle.data('id'));
            Aggregator.setBanner();
        }

        $(window).scrollTop(0);
    },

    setBanner: function () {
        var $articleFull = $('.article-full:visible'),
            $bannerSection = $('#banner-section'),
            $bannerTemplate = $('#banner-template'),
            isNew = !$bannerSection.length,
            template;

        if (!$bannerTemplate.length) {
            return;
        }

        isNew || $bannerSection.hide();

        if (!$articleFull.length) {
            return;
        }

        if (isNew) {
            template = Handlebars.compile($bannerTemplate.html());
            $bannerSection = $(template({}));
        }


        $bannerSection.insertAfter($articleFull);
        $bannerSection.show();

        isNew && (adsbygoogle = window.adsbygoogle || []).push({});
    },

    initSocial: function (id) {
        var $block = $('#af' + id),
            link = $('.social-block', $block).data('social-link');

        var $socialFb = $('.social-fb', $block),
            $socialVk = $('.social-vk', $block),
            $socialOk = $('.social-ok', $block),
            $socialTw = $('.social-tw', $block);

        if ($socialFb.length) {
            Share.countFb(link, function (count) {
                $socialFb.text(count);
            });
        }

        if ($socialVk.length) {
            Share.countVk(link, function (count) {
                $socialVk.text(count);
            });
        }

        if ($socialOk.length) {
            Share.countOk(link, function (count) {
                $socialOk.text(count);
            });
        }

        if ($socialTw.length) {
            Share.countTw(link, function (count) {
                $socialTw.text(count);
            });
        }
    },

    initTime: function () {
        var updateTime = function () {
            var date = new Date();
            var days = Aggregator.messages.weekdayNames;
            var day = date.getDay();

            $('#time').html(days[day] + ', ' + date.getHours() + ':' + ('0' + date.getMinutes()).substr(-2));
        };

        updateTime();
        setInterval(updateTime, 1000);
    },

    initWeather: function () {
        return;

        $.getJSON('http://api.rambler.ru/weather/informer', function (data) {
            console.log(data);
        });
    },

    initExchangeRates: function () {
        var _this = this,
            params = {};

        $('.exchange-current .ex-delta').each(function () {
            //new Odometer({el: this, value: $(this).text()});
        });
        $('.exchange-current .ex-value').each(function () {
            //new Odometer({el: this, value: $(this).text()});
        });

        if ($('.container-rate-currency').data('full')) {
            params.full = 1;
        }

        Visibility && Visibility.every(1000 * 60, function () {
            _this.query('/getExchangeRatesCurrent', params, function (rates) {
                _this.updateExchangeRates(rates);
            });
        });
    },

    updateExchangeRates: function (rates) {
        $.each(rates, function () {
            var $block = $('.exchange-current[data-code="' + this.code + '"]'),
                $delta = $('.ex-delta', $block),
                deltaFloat = parseFloat(parseFloat(this.delta).toFixed(2));

            $('.ex-value', $block).text(parseFloat(this.value).toFixed(2));
            $delta.text(this.delta || '');

            $delta.removeClass('up').removeClass('down');

            if (deltaFloat) {
                $delta.addClass(deltaFloat > 0 ? 'up' : 'down').show();
            }
            else {
                $delta.hide();
            }
        });
    },

    initTopics: function () {
        $('body')
            .on('click', '#topics-all', function (e) {
                e.preventDefault();
                e.stopPropagation();

                $('li:not(:visible)', '#topics-list').slideDown();
                $(this).hide();
            });

        $('li:eq(5)', '#topics-list').nextAll().hide();
        $('#topics-all').show();
    },

    changeTitle: function (title) {
        document.title = (title ? (title + ' - ') : '') + $('title').data('default');
    },

    showLoading: function () {
        $('#articles-loading').addClass('loading');
    },

    hideLoading: function () {
        $('#articles-loading').removeClass('loading');
    },

    refreshArticles: function (articles) {
        if (typeof articles === 'undefined') {
            Aggregator.articlesParams.offset = 0;
            Aggregator.loadArticles(Aggregator.articlesParams, Aggregator.refreshArticles);
            return;
        }

        if (!articles.length) {
            return;
        }

        Aggregator.articlesParams.offset = 0;
        Aggregator.articlesIds = [];

        $('#articles-list').empty();
        $(window).scrollTop(0);

        Aggregator.updateRefreshBlock(0);
        Aggregator.appendArticles(articles);
    },

    appendArticles: function (articles) {
        if (typeof articles === 'undefined') {
            Aggregator.loadArticles(Aggregator.articlesParams, Aggregator.appendArticles);
            return;
        }

        var $container = $('#articles-list'),
            template = Handlebars.compile($('#article-template').html()),
            templateFull = Handlebars.compile($('#article-full-template').html());

        $.each(articles, function () {
            ++Aggregator.articlesParams.offset;
            Aggregator.articlesIds.push(this.id);

            var $a = $(template(this))
                .data('id', this.id)
                .data('data', this)
                .attr('id', 'a' + this.id);

            var $af = $(templateFull(this))
                .data('id', this.id)
                .attr('id', 'af' + this.id);

            $container.append($a).append($af);
        });
    },


    loadArticles: function (params, callback) {
        if (Aggregator.loadingArticles || Aggregator.emptyArticles) {
            return;
        }

        Aggregator.loadingArticles = true;
        Aggregator.showLoading();

        Aggregator.query('/getArticles', params, function (articles) {
            Aggregator.loadingArticles = false;
            Aggregator.hideLoading();

            if (articles.length === 0) {
                $('#articles-loading').hide();
            }

            callback(articles);
        });
    },

    query: function (link, params, callback) {
        $.getJSON(link, params, function (data) {
            if (data.success) {
                callback(data.response, params);
                return;
            }

            console.log('[API Error] ' + data.error);
        });
    },

    isHeigthScroll: function () {
        var b = document.body,
            e = document.documentElement,
            c = 'clientHeight',
            a = 'scrollHeight';

        return /CSS/.test(document.compatMode) ? (e[c] < e[a]) : (b[c] < b[a]);
    },

    getCookie: function (key) {
        var e = document.cookie.match(new RegExp("(?:^|; )" + key.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
        return e ? decodeURIComponent(e[1]) : null;
    },

    setCookie: function (key, val, days) {
        var d = new Date;
        d.setDate(d.getDate() + days);
        document.cookie = key + "=" + escape(val) + (!days ? "" : "; expires=" + d.toUTCString()) + "; path=/";
    },

    initExtensionPopup: function () {
        var _this = this,
            $popup = $('#extension-popup'),
            chromeExtensionId = 'phoocmemlibnehglfgjfhogfohjmglgh';

        if (!$popup.length || this.getCookie('ext_hide')) {
           return;
        }

        $(window).resize(function () {
            _this.resizeExtensionPopup();
        });


        $('body')
            .on('click', '#extension-popup-close', function () {
                $popup.hide();
                _this.setCookie('ext_hide', !0, 60);
                _this.resizeExtensionPopup();
            })
            .on('click', '#extension-popup-link', function () {
                $popup.hide();
                _this.resizeExtensionPopup();
            });

        if (navigator.userAgent.indexOf('Chrome') > -1) {
            $.ajax({
                url: 'chrome-extension://' + chromeExtensionId + '/check.html',
                error: function () {
                    _this.showExtensionPopup('https://chrome.google.com/webstore/detail/' + chromeExtensionId);
                }
            });
        }
    },

    showExtensionPopup: function (url) {
        var $block = $('#extension-popup');
        $('#extension-popup-link', $block).attr('href', url);

        $block.show();
        this.resizeExtensionPopup();
    },

    resizeExtensionPopup: function () {
        var leftCol = $('.left-column'),
            rightCol = $('.right-column'),
            topBlock = $('#top-block'),
            contentBlock = $('#content-block'),
            popupBlock = $('#extension-popup'),
            scrollbarRightCol = $('#mCSB_2_scrollbar_vertical'),
            scrollbarRightColOffset = 93,
            topOffset = 0;

        if (popupBlock.is(':visible')) {
            topOffset = (popupBlock.height() + (parseInt(popupBlock.css('top')) || 0));
            scrollbarRightColOffset = 153;
        }

        leftCol.css({'top': topOffset + 'px'});
        rightCol.css({'top': topOffset + 'px'});
        topBlock.css({'top': topOffset + 'px'});
        contentBlock.css({paddingTop: (topBlock.height() + parseInt(topBlock.css('top') || 0)) + 'px'});
        scrollbarRightCol.css({'bottom': scrollbarRightColOffset + 'px'});
    }
};


Share = {
    vk: function (purl, ptitle, pimg, text) {
        var url = 'http://vkontakte.ru/share.php?';
        url += 'url=' + encodeURIComponent(purl);
        url += '&title=' + encodeURIComponent(ptitle);
        url += '&description=' + encodeURIComponent(text);
        url += '&image=' + encodeURIComponent(pimg);
        url += '&noparse=true';

        Share.popup(url);
    },

    ok: function (purl, text) {
        var url = 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1';
        url += '&st.comments=' + encodeURIComponent(text);
        url += '&st._surl=' + encodeURIComponent(purl);

        Share.popup(url);
    },

    fb: function (purl, ptitle, pimg, text) {
        var url = 'http://www.facebook.com/sharer.php?';
        url += 'u=' + encodeURIComponent(purl);

        Share.popup(url);
    },

    tw: function (purl, ptitle) {
        var url = 'http://twitter.com/share?';
        url += 'text=' + encodeURIComponent(ptitle);
        url += '&url=' + encodeURIComponent(purl);
        url += '&counturl=' + encodeURIComponent(purl);

        Share.popup(url);
    },

    popup: function (url) {
        window.open(url, '', 'toolbar=0,status=0,width=626,height=436');
    },


    countVk: function (url, callback) {
        $.getJSON('http://vkontakte.ru/share.php?act=count&index=1&url=' + url + '&format=json&callback=?');

        VK = {};
        VK.Share = {};
        VK.Share.count = function (index, count) {
            callback(count);
        };
    },

    countOk: function (url, callback) {
        $.ajax({
            url: 'http://www.odnoklassniki.ru/dk?st.cmd=shareData&ref=' + url,
            dataType: 'jsonp',
            jsonp: 'cb',
            success: function (response) {
                callback(response.count);
            }
        });
    },

    countFb: function (url, callback) {
        $.getJSON("http://graph.facebook.com/fql?q=SELECT url, total_count FROM link_stat WHERE url='" + url + "'", function (response) {
            if (response.data) {
                callback(response.data[0].total_count || 0);
            }
        });
    },

    countTw: function (url, callback) {
        $.ajax({
            url: 'http://urls.api.twitter.com/1/urls/count.json?url=' + url,
            dataType: 'jsonp',
            jsonp: 'callback',
            success: function (response) {
                callback(response.count);
            }
        });
    }
};
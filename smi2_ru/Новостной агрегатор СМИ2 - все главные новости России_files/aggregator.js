var Aggregator = {
    snap: null,

    articlesParams: {
        offset: 0,
        limit: 20
    },

    messages: {
        weekdayNames: [
            'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
        ]
    },

    init: function () {
        Aggregator.initArticlesParams();
        Aggregator.initTopics();
        Aggregator.initTime();
        Aggregator.initWeather();
        Aggregator.initExchangeRates();
        Aggregator.initInfinityScroll();

        $('body')
            .on('click', '.article', function (e) {
                //e.preventDefault();

                var $this = $(this),
                    articleId = $this.data('id');

                $('.article-full').hide();
                $('.article').show();

                $this.hide();
                $('#af' + articleId).show();
                Aggregator.setBanner();

                $('body').scrollTo('#af' + articleId, 500, {offset: -60});

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
            });

            Aggregator.initMainArticle();
    },

    initInfinityScroll: function () {
        $(window).scroll(function () {
            if (document.body.scrollHeight <= (document.documentElement.scrollTop || document.body.scrollTop) + $(window).height() + 300) {
                Aggregator.loadArticles();
            }
        });

        if (!Aggregator.isHeigthScroll()) {
            Aggregator.loadArticles();
        }
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
        var _this = this;


        $('.exchange-current .ex-delta').each(function () {
            new Odometer({el: this, value: $(this).text()});
        });
        $('.exchange-current .ex-value').each(function () {
            //new Odometer({el: this, value: $(this).text()});
        });


        setInterval(function () {
            _this.query('/getExchangeRatesCurrent', {}, function (rates) {
                _this.updateExchangeRates(rates);
            });
        }, 1000 * 20);
    },

    updateExchangeRates: function (rates) {
        $.each(rates, function () {
            var $block = $('.exchange-current[data-code=' + this.code + ']'),
                $delta = $('.ex-delta', $block);

            $('.ex-value', $block).text(parseFloat(this.value).toFixed(2));
            $delta.text(parseFloat(parseFloat(this.delta).toFixed(2)) || '');

            $delta.removeClass('up').removeClass('down');

            if (parseFloat(parseFloat(this.delta).toFixed(2))) {
                $delta.addClass(this.delta > 0 ? 'up' : 'down').show();
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

    loadArticles: function (reload) {
        if (reload) {
            Aggregator.articlesParams.offset = 0;
        }
        else if (Aggregator.emptyArticles) {
            return;
        }

        if (Aggregator.loadingArticles) {
            return;
        }

        if (Aggregator.snap !== null) {
            Aggregator.articlesParams.snap = Aggregator.snap;
        }

        Aggregator.loadingArticles = true;
        Aggregator.showLoading();

        Aggregator.query('/getArticles', Aggregator.articlesParams, function (articles) {
            var $container = $('#articles-list'),
                template = Handlebars.compile($('#article-template').html()),
                templateFull = Handlebars.compile($('#article-full-template').html());

            $.each(articles, function () {
                ++Aggregator.articlesParams.offset;

                var $a = $(template(this))
                    .data('id', this.id)
                    .attr('id', 'a' + this.id);

                var $af = $(templateFull(this))
                    .data('id', this.id)
                    .attr('id', 'af' + this.id);

                $container.append($a).append($af);
            });

            Aggregator.loadingArticles = false;
            Aggregator.hideLoading();

            if (articles.length === 0) {
                $('#articles-loading').hide();
            }
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
        $.getJSON("http://graph.facebook.com/fql?q=SELECT url, share_count FROM link_stat WHERE url='" + url + "'", function (response) {
            if (response.data) {
                callback(response.data[0].share_count);
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
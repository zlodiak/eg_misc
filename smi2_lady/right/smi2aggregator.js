var Smi2Aggregator = {
  apiUrl: '//apiaggr.smi2.net/news/',
  siteUrl: (window.location.protocol + '//' + window.location.hostname) + location.pathname,

  agencyId: 0,

  group: null,
  geoGroup: null,
  isAdPreview: false,
  notReloadMainItem: false,

  mainItemId: null,
  mainItemType: null,
  mainItem: {},

  defDomain: '',
  defDomainLogo: '',

  articlesParams: {
    offset: 0,
    limit: 20
  },

  lang: 'ru',
  snap: null,

  loadingArticles: false,
  loadingNews: {},

  emptyArticles: false,

  listBlockId: null,
  rightBlockId: null,

  adMainBlockId: null,
  adMainNewsId: null,

  news: {},
  newsIds: {},

  freqNews: 3,
  itemsLength: 0,

  $itemTemplate: null,
  $newsTemplate: null,
  $adTemplate: null,

  monthNames: {
    'ru': {
      1: 'Ð¯Ð½Ð²Ð°Ñ€ÑŒ',
      2: 'Ð¤ÐµÐ²Ñ€Ð°Ð»ÑŒ',
      3: 'ÐœÐ°Ñ€Ñ‚',
      4: 'ÐÐ¿Ñ€ÐµÐ»ÑŒ',
      5: 'ÐœÐ°Ð¹',
      6: 'Ð˜ÑŽÐ½ÑŒ',
      7: 'Ð˜ÑŽÐ»ÑŒ',
      8: 'ÐÐ²Ð³ÑƒÑÑ‚',
      9: 'Ð¡ÐµÐ½Ñ‚ÑÐ±Ñ€ÑŒ',
      10: 'ÐžÐºÑ‚ÑÐ±Ñ€ÑŒ',
      11: 'ÐÐ¾ÑÐ±Ñ€ÑŒ',
      12: 'Ð”ÐµÐºÐ°Ð±Ñ€ÑŒ'
    },
    'en': {
      1: 'January',
      2: 'February',
      3: 'March',
      4: 'April',
      5: 'May',
      6: 'June',
      7: 'July',
      8: 'August',
      9: 'September',
      10: 'October',
      11: 'November',
      12: 'December'
    }
  },

  messages: {
    ru: {
      allTopics: 'ÐŸÐ¾ Ð²ÑÐµÐ¼ Ñ‚ÐµÐ¼Ð°Ð¼'
    },
    en: {
      allTopics: 'All topics'
    }
  },

  getSiteUrl: function (params) {
    var params = params || {},
      url = this.siteUrl,
      query;

    if (this.adMainBlockId) {
      params.bl = this.adMainBlockId;
      params.ac_ad = this.adMainNewsId;
    }

    query = $.param(params);

    if (query) {
      url += '?' + query;
    }

    return url;
  },

  getItemUrl: function (id, type) {
    var params = {};
    params[type || Smi2Aggregator.mainItemType] = id;

    return this.getSiteUrl(params);
  },

  initTitle: function () {
    var $title = $('title');
    $title.data('default', $title.text());
  },

  initUriParams: function () {
    this.adMainBlockId = this.adMainBlockId || this.getUriParameterByName('bl');
    this.adMainNewsId = this.adMainNewsId || this.getUriParameterByName('ac_ad');
  },

  changeTitle: function (title) {
    document.title = (title ? (title + ' - ') : '') + $('title').data('default');
  },

  setMainItem: function (id, type) {
    var iId = id;

    if (!type) {
      $.each(['article', 'news'], function (i, t) {
        iId = Smi2Aggregator.getUriParameterByName(t);

        if (iId) {
          type = t;
          return false;
        }
      });
    }

    if (id && !this.isAdPreview) {
      if (!history || !history.pushState) {
        location.href = this.getItemUrl(id, type);
      }
      else {
        history.pushState(null, null, this.getItemUrl(id, type));
        $(document).scrollTop(0);
      }
    }

    if (iId) {
      this.mainItemId = iId;
      this.mainItemType = type;
      this.initMainItem();
    }
  },

  init: function () {
    this.updateRightAds();

    this.initUriParams();
    this.initTitle();
    this.firstInit();
    this.setMainItem();

    $('body')
      .on('click', '#a-articles-load', function (e) {
        e.preventDefault();

        Smi2Aggregator.loadArticles();
      })
      .on('click', '.a-article-link', function (e) {
        var $this = $(this),
          id = $this.data('id');

        if (Smi2Aggregator.notReloadMainItem) {
          // do nothing
        }
        else if (Smi2Aggregator.isAdPreview) {
          location.href = Smi2Aggregator.getItemUrl(id, 'article');
        }
        else {
          id && Smi2Aggregator.setMainItem(id, 'article');
          Smi2Aggregator.loadArticles(1);
        }
      })
      .on('click', '.a-link-site', function (e) {
        e.preventDefault();
        e.stopPropagation();

        location.href = Smi2Aggregator.getSiteUrl();
      });


      $('#a-article-main').on('click', '.a-article-direct-link', function (e) {
        if (Smi2Aggregator.isAdPreview) {
          Smi2Aggregator.setMainItem(-1, 'article');
        }

        Smi2Aggregator.loadArticles(1);
      });

    $('.a-article-social').click(function (e) {
      e.preventDefault();
      Smi2Aggregator.openSocialLink($(this));
    });

    /*
    $(window).scroll(function () {
      if (document.body.scrollHeight <= (document.documentElement.scrollTop || document.body.scrollTop) + $(window).height() + 100) {
        Smi2Aggregator.loadArticles();
      }
    });
    */
  },

  firstInit: function (data) {
    if (!data) {
      Smi2Aggregator.queryApi('getInfo', {}, this.firstInit);
      return;
    }

    Smi2Aggregator.initTimes(data.times);
    Smi2Aggregator.initTopics(data.topics);
    Smi2Aggregator.initSources();

    $('.a-filter-block').show();

    Smi2Aggregator.loadArticles();
  },

  resetTopics: function () {
    var $block = $('.a-filter-topics-block');
    var $list = $('.a-filter-topics-list', $block);

    $('a:not(.all)', $list).removeClass('active');
    Smi2Aggregator.updateTopics();
  },

  initTopics: function (topics) {
    var $block = $('.a-filter-topics-block');
    var $list = $('.a-filter-topics-list', $block);

    $list.empty();

    $.each($.extend({0: {title: Smi2Aggregator.messages[Smi2Aggregator.lang].allTopics}}, topics), function (id, data) {
      $list.append(
        $('<li>')
          .addClass('col-sm-2')
          .addClass('col-xs-10')
          .append(
            $('<a>')
              .attr('href', '#')
              .data('topic', id)
              .text(data.title)
              .addClass(id == 0 ? 'all' : '')
          )
        );
    });

    $list.on('click init', 'a', function (e) {
      e.preventDefault();

      var $this = $(this),
        $all = $('a.all', $list),
        isAll = $this.hasClass('all');

      if ($this.hasClass('active')) {
        if (!isAll) {
          $this
            .removeClass('active')
            .find('span')
            .remove();
        }
      }
      else {
        if (isAll) {
          $('a', $list)
            .removeClass('active')
            .find('span')
            .remove();

          $all.addClass('active');
        }
        else {
          $this
            .append($('<span>').text('Ã—'))
            .addClass('active');

          $all.removeClass('active');
        }
      }

      Smi2Aggregator.updateTopics(1);
    });

    $block.on('click init', '.a-filter-topics-select', function (e) {
      e.preventDefault();
      $block.slideUp(function () {
        $('.a-articles-block').removeClass('menu-open');
      });
    });

    $('body').on('click', '.a-filter-topics-current', function () {
      $block.slideToggle();
      $('.a-articles-block').toggleClass('menu-open');
    });

    Smi2Aggregator.updateTopics(1);
  },

  initTimes: function (times) {
    var $ul = $('.a-filter-time');
    $ul.empty();

    $.each(times, function (time, name) {
      $ul.append(
        $('<li>').append(
          $('<a>').attr('href', '#').data('time', time).text(name)
        )
      );
    });

    $ul.on('click init', 'a', function (e) {
      var $this = $(this);

      $('a', $ul).removeClass('active');
      $this.addClass('active');

      Smi2Aggregator.articlesParams.time = $this.data('time');
      (e.type == 'click') && Smi2Aggregator.loadArticles(1);

      e.preventDefault();
    });

    $('a:first', $ul).trigger('init');
  },

  initSources: function () {
    return;

    $('body').on('click init', '.a-article-source', function (e) {
      var $this = $(this);

      Smi2Aggregator.resetTopics();
      Smi2Aggregator.articlesParams.filterType = 'publisher';
      Smi2Aggregator.articlesParams.filter = $this.data('id');

      (e.type == 'click') && Smi2Aggregator.loadArticles(1);

      e.stopPropagation();
      e.preventDefault();
    });
  },

  initMainItem: function (item) {
    console.log(111111);
    if (!item) {
      if (Smi2Aggregator.mainItemId) {
        var params = {
          filterType: 'id',
          filter: Smi2Aggregator.mainItemId
        };

        var method = Smi2Aggregator.mainItemType == 'news' ? 'getNews' : 'getArticle';
        Smi2Aggregator.queryApi(method, params, this.initMainItem);
      }

      return;
    }

    if (!item.length) {
      return;
    }

    item = item.pop();
    Smi2Aggregator.mainItem = item;
    Smi2Aggregator.mainItemId = item.id;
    Smi2Aggregator.changeTitle(item.title);


    var $main = $('#a-article-main');

    $('.a-article-title', $main).text(item.title);
    $('.a-article-description', $main).text(item.announce);
    $('.a-article-link', $main).attr('href', Smi2Aggregator.getItemUrl(item.id)).data('id', item.id);
    $('.a-article-direct-link', $main).attr('href', Smi2Aggregator.prepareNewsUrl(item.url));
    $('.a-article-date', $main).text(item.create_date);

    if (item.img_url) {
      $('.news-first').removeClass('noImg');
      $('.a-article-image', $main).attr('src', item.img_url);
    } else {
      $('.news-first').addClass('noImg');
      $('.a-article-image', $main).attr('src', '');
    }

    $('.a-article-source', $main).empty()
      .data('id', item.pub_id)
      .append($('<img>').attr('src', item.pub_logo || Smi2Aggregator.defDomainLogo).attr('weight', 16).attr('height', 16))
      .append(item.pub_domain || Smi2Aggregator.defDomain);

    $main.show();
  },

  openSocialLink: function ($link) {
    var a = Smi2Aggregator.mainItem,
      social = $link.data('social');

    if (Smi2Aggregator.isAdPreview) {
      var $main = $('#a-article-main');

      a = {
        title: $('.a-article-title', $main).text(),
        img_url: $('.a-article-image', $main).attr('src'),
        announce: $('.a-article-description', $main).text()
      };
    }

    if (Share[social] !== undefined) {
        Share[social](location.href, a.title, a.img_url, a.announce);
    }
  },

  updateTopics: function (load) {
    var $current = $('.a-filter-topics-current');
    var $list = $('.a-filter-topics-list');
    var $a = $('a.active', $list);

    if (!$a.length) {
      $a = $('a:first', $list);
      $a.trigger('init');
    }

    var topics = [];
    $a.each(function () {
      topics.push(parseInt($(this).data('topic')));
    });

    $current
      .data('topic', topics.join(','))
      .text($a.length > 1 ? 'Ð’Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ðµ' : $a.text().replace('Ã—', ''));

    if (load) {
      Smi2Aggregator.articlesParams.filterType = 'topic';
      Smi2Aggregator.articlesParams.filter = topics.join(',');

      Smi2Aggregator.loadArticles(1);
    }
  },

  loadArticles: function (reload) {
    if (reload) {
      Smi2Aggregator.articlesParams.offset = 0;
    }
    else if (Smi2Aggregator.emptyArticles) {
      return;
    }

    if (Smi2Aggregator.loadingArticles) {
      return;
    }
    
    if (Smi2Aggregator.snap !== null) {
      Smi2Aggregator.articlesParams.snap = Smi2Aggregator.snap;
    }

    $('#a-articles-loader').show();
    Smi2Aggregator.loadingArticles = true;
    Smi2Aggregator.queryApi('getArticles', Smi2Aggregator.articlesParams, this.setArticles);
  },

  setArticles: function (articles) {
    $('#a-articles-loader').hide();
    Smi2Aggregator.loadingArticles = false;

    if (Smi2Aggregator.articlesParams.offset == 0) {
      $('.a-article-item', '#a-articles-container').remove();
      $('.a-ad-item', '#a-articles-container').remove();
    }

    Smi2Aggregator.emptyArticles = !articles.length;

    if (Smi2Aggregator.emptyArticles) {
      if (Smi2Aggregator.articlesParams.time == 1 && Smi2Aggregator.articlesParams.offset == 0) {
        $('.a-filter-time a:last').trigger('init');
        Smi2Aggregator.loadArticles(1);
      }
      return;
    }

    var $container = $('#a-articles-container');

    $.each(articles, function () {
      ++Smi2Aggregator.articlesParams.offset;
      $container.append(Smi2Aggregator.createItem(this));
    });

    Smi2Aggregator.implementListNews();
    Smi2Aggregator.updateRightAds();
  },

  getItemTemplate: function () {
    if (!Smi2Aggregator.$itemTemplate) {
      Smi2Aggregator.$itemTemplate = $('#a-article-item-template')
      .clone()
      .removeAttr('id')
      .addClass('a-article-item')
      .css('display', 'block');
    }

    return Smi2Aggregator.$itemTemplate;
  },

  getNewsTemplate: function () {
    if (!Smi2Aggregator.$newsTemplate) {
      Smi2Aggregator.$newsTemplate = $('#a-article-news-template')
      .clone()
      .removeAttr('id')
      .addClass('a-article-item')
      .addClass('a-article-news')
      .css('display', 'block');
    }

    return Smi2Aggregator.$newsTemplate;
  },

  getAdTemplate: function () {
    if (!Smi2Aggregator.$adTemplate) {
      Smi2Aggregator.$adTemplate = $('#a-ad-item-template')
      .clone()
      .removeAttr('id')
      .addClass('a-ad-item')
      .css('display', 'inline-block');
    }

    return Smi2Aggregator.$adTemplate;
  },

  createItem: function (data) {
    console.log(22222);
    var $item = Smi2Aggregator.getItemTemplate().clone();

    var date = new Date(data.time * 1000);
    var createDate = date.getDate() + ' '
      + Smi2Aggregator.monthNames[Smi2Aggregator.lang][date.getMonth() + 1] + ' '
      + date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);

    $('.a-article-number', $item).text(++Smi2Aggregator.itemsLength);
    $item.attr('href', Smi2Aggregator.prepareNewsUrl(data.url)).data('id', data.id);
    $('.a-article-date', $item).text(createDate);
    $('.a-article-rating-count', $item).text(data.views || 0).hide();

    $('.a-article-title', $item)
      .append($('<img>').attr('src', data.pub_logo || Smi2Aggregator.defDomainLogo).attr('weight', 16).attr('height', 16))
      .append(data.title);

    $('.a-article-source', $item).empty()
      .data('id', data.pub_id)
      .append(data.pub_domain || Smi2Aggregator.defDomain);

    if (data.delta) {
      $('.a-article-rating-block', $item).addClass(data.delta > 0 ? 'up' : 'down');
    }

    $item.data('id', data.id);

    return $item;
  },

  createNews: function (data) {
    var $news = Smi2Aggregator.getNewsTemplate().clone();

    $news.attr('href', data.url);
    $('.a-article-title', $news).text(data.title);

    return $news;
  },

  createAd: function (data) {
    var $ad = Smi2Aggregator.getAdTemplate().clone();

    $('.a-ad-link', $ad).attr('href', data.url);
    $('.a-ad-image', $ad).attr('src', data.img);
    $('.a-ad-title', $ad).text(data.title);

    return $ad;
  },

  reCountItems: function () {
    var $items = $('.a-article-item');
    var n = 1;

    $items.each(function () {
      $('.a-article-number', $(this)).text(n++);
    });

    Smi2Aggregator.itemsLength = $items.length;
  },

  implementListNews: function (news) {
    if (!Smi2Aggregator.listBlockId) {
      return;
    }

    var blockId = Smi2Aggregator.listBlockId;
    var newsIds = Smi2Aggregator.newsIds[blockId] || [];

    if (!news) {
      Smi2Aggregator.getNews(blockId, Smi2Aggregator.implementListNews);
      return;
    }

    var filter = ':nth-child(' + Smi2Aggregator.freqNews + 'n+' + Smi2Aggregator.freqNews + ')';
    var $items = $('.a-article-news').length
      ? $('.a-article-news:last').nextAll(filter)
      : $('.a-article-item' + filter);


    $items.each(function () {
      if (!news.length) {
        return;
      }

      var n = news.pop();
      newsIds.push(n.id);

      Smi2Aggregator.createNews(n)
        .insertAfter($(this));
    });

    Smi2Aggregator.news[blockId] = news;
    Smi2Aggregator.newsIds[blockId] = newsIds.slice(-100);

    Smi2Aggregator.reCountItems();
  },

  updateRightAds: function (news) {
    if (!Smi2Aggregator.rightBlockId) {
      return;
    }

    if (!$('.sidebar').is(':visible')) {
      return;
    }

    var blockId = Smi2Aggregator.rightBlockId;
    var newsIds = Smi2Aggregator.newsIds[blockId] || [];

    if (!news) {
      Smi2Aggregator.getNews(blockId, Smi2Aggregator.updateRightAds);
      return;
    }


    while (1) {
      if (!news.length) {
        Smi2Aggregator.updateRightAds();
        break;
      }

      var bodyHeight = $('body').height();
      var $lastAd = $('.a-ad-item:last');
      var lastAdHeight = $lastAd.length ? $lastAd.height() : 0;

      if ($lastAd.length && (($lastAd.offset().top + lastAdHeight) >= (bodyHeight - lastAdHeight))) {
        break;
      }

      var n = news.pop();
      newsIds.push(n.id);

      var $ad = Smi2Aggregator.createAd(n);

      $('#a-ad-items-list').append($ad);
    }

    Smi2Aggregator.news[blockId] = news;
    Smi2Aggregator.newsIds[blockId] = newsIds.slice(-100);

  },

  queryApi: function (method, params, callback) {
    var extParams = {
      call: method,
      agency: Smi2Aggregator.agencyId
    };

    if (Smi2Aggregator.group) {
      extParams.group = Smi2Aggregator.group;
    }

    if (Smi2Aggregator.geoGroup) {
      extParams.geo_group = Smi2Aggregator.geoGroup;
    }

    $.ajax({
        url: Smi2Aggregator.apiUrl,
        data: $.extend(extParams, params),
        dataType: 'jsonp',
        jsonp: 'callback',
        success: function (data) {
          if (data.sys) {
            Smi2Aggregator.snap = data.sys.snap;
          }

          if (data.response) {
            callback(data.response, params);
            return;
          }

          console.log('[API Error] ' + data.error.message);
        }
    });

    /*
    $.getJSON(Smi2Aggregator.apiUrl, $.extend({call: method}, params), function (data) {
      if (data.response) {
        callback(data.response, params);
        return;
      }

      console.log('[API Error] ' + data.error.message);
    });
    */
  },

  getNews: function (blockId, callback) {
    var news = Smi2Aggregator.news[blockId] || [];
    var newsIds = Smi2Aggregator.newsIds[blockId] || [];

    if (news.length) {
      callback(news);
      return;
    }

    if (Smi2Aggregator.loadingNews[blockId]) {
      return;
    }

    Smi2Aggregator.loadingNews[blockId] = true;

    $.getJSON('//news.smi2.ru/data/js/' + blockId + '.js', {exclude: newsIds.join(',')}, function (data) {
      if (Smi2Aggregator.adMainBlockId) {
        $.each(data.news, function (i) {
          data.news[i].url = Smi2Aggregator.prepareNewsUrl(this.url);
        });
      }

      Smi2Aggregator.loadingNews[blockId] = false;
      Smi2Aggregator.news[blockId] = data.news;
      callback(data.news);
    });
  },

  getUriParameterByName: function (name) {
    var match = (new RegExp('[?&]' + name + '=([^&]*)')).exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  },

  prepareNewsUrl: function (url) {
    if (Smi2Aggregator.adMainBlockId) {
        url = url
          .replace(/&bl=(\d+)&/, '&bl=' + Smi2Aggregator.adMainBlockId + '&ac_bl=$1&ac_ad=' + Smi2Aggregator.adMainNewsId + '&')
          .replace(/ct=[\w\-]+/, 'ct=adpreview_more&out=1');
    }

    return url;
  }
};


Share = {
  vkontakte: function (purl, ptitle, pimg, text) {
    var url = 'http://vkontakte.ru/share.php?';
    url += 'url=' + encodeURIComponent(purl);
    url += '&title=' + encodeURIComponent(ptitle);
    url += '&description=' + encodeURIComponent(text);
    url += '&image=' + encodeURIComponent(pimg);
    url += '&noparse=true';

    Share.popup(url);
  },

  odnoklassniki: function (purl, text) {
    var url = 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1';
    url += '&st.comments=' + encodeURIComponent(text);
    url += '&st._surl=' + encodeURIComponent(purl);

    Share.popup(url);
  },

  facebook: function (purl, ptitle, pimg, text) {
    var url = 'http://www.facebook.com/sharer.php?';
    url += 'u=' + encodeURIComponent(purl);

    Share.popup(url);
  },

  twitter: function (purl, ptitle) {
    var url = 'http://twitter.com/share?';
    url += 'text=' + encodeURIComponent(ptitle);
    url += '&url=' + encodeURIComponent(purl);
    url += '&counturl=' + encodeURIComponent(purl);

    Share.popup(url);
  },

  mailru: function (purl, ptitle, pimg, text) {
    var url = 'http://connect.mail.ru/share?';
    url += 'url=' + encodeURIComponent(purl);
    url += '&title=' + encodeURIComponent(ptitle);
    url += '&description=' + encodeURIComponent(text);
    url += '&image_url=' + encodeURIComponent(pimg);

    Share.popup(url)
  },

  popup: function (url) {
    window.open(url, '', 'toolbar=0,status=0,width=626,height=436');
  }
};
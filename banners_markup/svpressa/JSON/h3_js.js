function smiMK3019(posts) {
    p = 0;
    tb = '';
    for (r = 0; r < 1; r++) {
        row = '';
        for (c = 0; c < 3; c++) {
            if (posts[p] !== undefined) {
                row += smiTD3019(posts[p][2], posts[p][1], posts[p][3], posts[p][0]);
            }
            p++;
        }
        tb = row;
    };
    if (smiEL3019 && tb) {
        smiEL3019.innerHTML = tb;
    }
}
var names = ['first', 'second', 'third'];

function smiTD3019(title, img, url, cat) {
    cls = names[c];
    return '<article class="b-article b-col_1-3 b-col_1-3_' + cls + '"><a href="' + url + '" class="b-article__img b-article__img_aside"><picture><!--[if IE 9]><video style="display: none;"><![endif]--><source media="(min-width: 600px)" srcset="' + img.replace('250_187', '243_141') + '"></source><!--[if IE 9]></video><![endif]--><img alt="' + title + '" srcset="' + img.replace('250_187', '96_56') + '"></picture></a><a href="' + url + '" class="b-article__title b-article__title_aside">' + title + '</a></article>';
}
var smiEL3019 = document.getElementById('smi_teaser_3019');
if (smiEL3019) {
    ST3019 = ' ';
    var smiST3019 = document.createElement('style');
    smiST3019.type = 'text/css';
    smiEL3019.parentNode.insertBefore(smiST3019, smiEL3019);
    if (smiST3019.styleSheet) {
        smiST3019.styleSheet.cssText = ST3019;
    } else {
        smiST3019.appendChild(document.createTextNode(ST3019))
    };
    var smiDATE = new Date();
    var smiDA3019 = document.createElement('script');
    smiDA3019.type = 'text/javascript';
    smiDA3019.async = true;
    smiDA3019.src = '//news.smi2.ru/data/js/83320.js';
    smiDA3019.charset = 'utf8';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(smiDA3019, s);
}
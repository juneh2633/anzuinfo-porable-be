var userInfo,
  trackCount = 0,
  trackDataList = [],
  currentPage = 0,
  maxPage = 0;
var anzuinfoUrl = 'http://localhost:3000';
function setAttribute(element, attr, value) {
  element.setAttribute(attr, value);
}
function delay(timeout) {
  var deferred = $.Deferred();
  return (
    setTimeout(function () {
      deferred.resolve();
    }, timeout),
    deferred.promise()
  );
}
function checkFinish() {
  if (maxPage <= currentPage && userInfo.length > 0) {
    const payload = {
      user: userInfo,
      tracks: trackDataList,
    };

    fetch(anzuinfoUrl + '/playdata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`서버 응답 오류: ${response.status}`);
        } else if (response.status == 404) {
          alert('안즈인포에 계정이 없습니다.');
        }
        return response.json();
      })
      .then((data) => {
        console.log('서버 응답 성공:', data);
        alert(
          '데이터 전송이 성공적으로 완료되었습니다. 사이트를 종료해도 됩니다.',
        );
      })
      .catch((error) => {
        console.error('전송 중 오류 발생:', error);
      });
  }
}

function getTrackList(page) {
  delay(1000 * (page + 2)).done(function () {
    $.ajax({
      type: 'GET',
      url: `https://p.eagate.573.jp/game/sdvx/vi/playdata/musicdata/index.html?page=${page}&sort=0`,
      async: true,
      success: function (response) {
        $(response)
          .find('.data_col')
          .each(function () {
            var trackName;
            $(this)
              .find('td')
              .each(function () {
                var className = $(this).attr('class');
                if (className === 'music') {
                  trackName = $(this)
                    .find('.title a')
                    .text()
                    .replace('(EXIT TUNES)', '');
                  if (
                    trackName === 'Prayer' &&
                    $(this).find('.artist').text() ===
                      '溝口ゆうま feat. 大瀬良あい'
                  ) {
                    trackName += ' (MÚSECA)';
                  }
                } else {
                  var trackValue = $(this).text();
                  if (trackValue !== '0') {
                    var trackStatus = $(this)
                      .find('img')
                      .first()
                      .attr('src')
                      .replace(
                        '/game/sdvx/vi/images/playdata/rival/rival_mark_',
                        '',
                      )
                      .replace('.png', '');
                    trackCount++;
                    trackDataList.push(
                      `${trackName}\t${className}\t${trackStatus}\t${trackValue}`,
                    );
                    console.log(
                      `${trackName} 수집 완료! (${currentPage + 1}/${maxPage} 페이지)`,
                    );
                  }
                }
              });
          });
      },
      complete: function () {
        currentPage++;
        $('#pg').text(`${currentPage}/${maxPage} 페이지 수집 완료!`);
        console.log(`${currentPage}/${maxPage} 페이지 수집 완료`);
        checkFinish();
      },
    });
  });
}

$(function () {
  alert('잠시만 기다려주세요, 1~2분정도 걸립니다.');

  var overlayDiv = $('<div>').attr(
    'style',
    'position:fixed; top:0; z-index:100; width:100%; height:100%; background-color:rgba(0,0,0,0.5);',
  );
  var progressBar = $('<span>')
    .attr(
      'style',
      'position:fixed; bottom:0; z-index:101; width:100%; height:50px; background-color:lightpink; color:white; line-height:50px; text-align:center; font-size:24px;',
    )
    .attr('id', 'pg')
    .text('준비 중입니다...');

  $('body').append(overlayDiv).append(progressBar);

  $.ajax({
    type: 'GET',
    url: 'https://p.eagate.573.jp/game/sdvx/vi/playdata/profile/index.html',
    success: function (response) {
      var playerId = $(response).find('#player_id').text();
      var playerName = $(response).find('#player_name p:nth-child(2)').text();
      var forcePoint = $(response).find('#force_point').text();
      var skillLevel = $(response)
        .find('.profile_skill')
        .attr('class')
        .replace('profile_skill skill_', '')
        .replace('g', '');
      var playCount = $(response)
        .find('.profile_cnt')
        .first()
        .text()
        .replace('回', '');

      if (playerId) {
        userInfo = `${playerId}\t${playerName}\t${forcePoint}\t${skillLevel}\t${playCount}`;
      } else {
        $('#pg').text('e-amusement 로그인이 되어있지 않습니다.');
      }
    },
  });

  $.ajax({
    type: 'GET',
    url: 'https://p.eagate.573.jp/game/sdvx/vi/playdata/musicdata/index.html',
  }).done(function (response) {
    maxPage = Number(
      $(response)
        .find('.page')
        .text()
        .replace(/\s/g, '')
        .replace('＞', '')
        .split('・')
        .pop(),
    );
    if (maxPage <= 0) {
      $('#pg').text('베이직 코스가 없거나, 플레이 데이터가 존재하지 않습니다.');
    } else {
      for (var i = 1; i <= maxPage; i++) {
        getTrackList(i);
      }
    }
  });
});

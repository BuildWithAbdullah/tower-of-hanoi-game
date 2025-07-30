$(document).ready(function () {
    let towers = {
        A: [5, 4, 3, 2, 1],
        B: [],
        C: []
    };
    let selectedDiscSize = null;
    let selectedFromTower = null;
    let floatingDisc = null;
    let isDragging = false;
    let moveCount = 0;
    let maxMoves = 50;
    let seconds = 0;
    let timerInterval;
    let originalDisc = null;

    function initGame() {
        towers = { A: [5, 4, 3, 2, 1], B: [], C: [] };
        selectedDiscSize = null;
        selectedFromTower = null;
        isDragging = false;
        moveCount = 0;
        seconds = 0;
        originalDisc = null;
        if (floatingDisc) {
            floatingDisc.remove();
            floatingDisc = null;
        }
        $('#move-count').text(moveCount);
        $('#timer').text('00:00');
        $('#message').text('');
        $('.game-container').removeClass('game-over-blink');
        $('#game-over-overlay').remove();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        renderTowers();
        clearBlinking();
    }

    function updateTimer() {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        $('#timer').text(`${m}:${s}`);
    }

    function renderTowers() {
        $('.tower').each(function () {
            let towerId = $(this).attr('id').split('-')[1];
            $(this).empty();
            $(this).append(`<div class="pole"></div><div class="base"></div><div class="label">${towerId}</div>`);

            let discs = towers[towerId];
            for (let i = 0; i < discs.length; i++) {
                let size = discs[i];
                let width = 60 + size * 30;
                let bottom = 50 + i * 30;
                $(this).append(
                    `<div class="disc" data-size="${size}" data-tower="${towerId}" style="width:${width}px; bottom:${bottom}px;"></div>`
                );
            }
        });
    }

    function getTowerUnderMouse(x) {
        let found = null;
        $('.tower').each(function () {
            let offset = $(this).offset();
            let width = $(this).outerWidth();
            if (x >= offset.left && x <= offset.left + width) {
                found = $(this).attr('id').split('-')[1];
            }
        });
        return found;
    }

    function canPlaceDisc(towerArr, size) {
        return towerArr.length === 0 || towerArr[towerArr.length - 1] > size;
    }

    function checkWin() {
        if (towers.C.length === 5) {
            $('#message').text('You Win! All discs moved to Tower C!');
            clearInterval(timerInterval);
            removeHandlers();
            $('body').append(
                `<div id="game-over-overlay">
                    <div class="game-over-text">You Win!</div>
                    <div class="sad-icon">🎉</div>
                    <button id="game-over-reset-button">Restart Game</button>
                </div>`
            );
            // Attach click handler to reset button
            $('#game-over-reset-button').click(function (e) {
                $('#game-over-overlay').remove();
                initGame();
                e.stopPropagation();
            });
        } else if (moveCount >= maxMoves) {
            $('#message').text('Maximum moves reached.').addClass('game-over-message');
            $('.game-container').addClass('game-over-blink');
            clearInterval(timerInterval);
            removeHandlers();
            // Add overlay with game over message, sad icon, and reset button
            $('body').append(
                `<div id="game-over-overlay">
                    <div class="game-over-text">Game Over!</div>
                    <div class="sad-icon">😢</div>
                    <button id="game-over-reset-button">Reset Game</button>
                </div>`
            );
            // Attach click handler to reset button
            $('#game-over-reset-button').click(function (e) {
                $('#game-over-overlay').remove();
                initGame();
                e.stopPropagation();
            });
        }
    }

    function removeHandlers() {
        $(document).off('click', '.disc', onDiscClick);
        $(document).off('mousemove', onDiscMove);
        $(document).off('click', onDiscDrop);
    }

    function clearBlinking() {
        $('.tower').removeClass('blink-green blink-red');
    }

    function applyBlinking(invalidTowerId) {
        clearBlinking();
        $(`#tower-${invalidTowerId}`).addClass('blink-red');
        ['A', 'B', 'C'].forEach(t => {
            if (t !== invalidTowerId && (t === selectedFromTower || canPlaceDisc(towers[t], selectedDiscSize))) {
                $(`#tower-${t}`).addClass('blink-green');
            }
        });
        setTimeout(clearBlinking, 2000);
    }

    function onDiscClick(e) {
        if (isDragging) return;

        let disc = $(e.target);
        if (!disc.hasClass('disc')) return;

        let towerId = disc.data('tower');
        let topDiscSize = towers[towerId][towers[towerId].length - 1];

        if (disc.data('size') !== topDiscSize) {
            disc = $(`.tower#tower-${towerId} .disc[data-size="${topDiscSize}"]`);
        }

        selectedDiscSize = disc.data('size');
        selectedFromTower = towerId;
        originalDisc = disc;
        originalDisc.hide();

        let width = disc.width();
        floatingDisc = disc.clone().addClass('selected').css({
            position: 'absolute',
            zIndex: 1000,
            left: e.pageX - width / 2 + 'px',
            top: e.pageY - 15 + 'px',
            height: '30px',
            background: 'linear-gradient(45deg, #ff9f43, #ee5253)',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            display: 'block',
            opacity: 1
        }).appendTo('body');

        floatingDisc[0].offsetHeight;

        isDragging = true;
        e.stopPropagation();
    }

    function onDiscMove(e) {
        if (!isDragging || !floatingDisc) return;

        let width = floatingDisc.width();
        floatingDisc.css({
            left: e.pageX - width / 2 + 'px',
            top: e.pageY - 15 + 'px',
            display: 'block',
            opacity: 1
        });
    }

    function onDiscDrop(e) {
        if (!isDragging || !floatingDisc) return;

        if ($(e.target).is('#reset-button') || $(e.target).closest('#reset-button').length) {
            floatingDisc.remove();
            floatingDisc = null;
            isDragging = false;
            $('#reset-button').trigger('click');
            return;
        }

        let towerId = getTowerUnderMouse(e.pageX);

        if (towerId && (towerId === selectedFromTower || canPlaceDisc(towers[towerId], selectedDiscSize))) {
            floatingDisc.remove();
            floatingDisc = null;
            isDragging = false;
            towers[selectedFromTower].pop();
            towers[towerId].push(selectedDiscSize);
            moveCount++;
            $('#move-count').text(moveCount);
            renderTowers();
            checkWin();
            selectedDiscSize = null;
            selectedFromTower = null;
            originalDisc = null;
            clearBlinking();
        } else if (towerId) {
            showMessage("Can't place a larger disc on a smaller disc.");
            applyBlinking(towerId);
        } else {
            floatingDisc.remove();
            floatingDisc = null;
            isDragging = false;
            originalDisc.show();
            showMessage("Invalid drop location.");
            selectedDiscSize = null;
            selectedFromTower = null;
            originalDisc = null;
            clearBlinking();
        }

        e.stopPropagation();
    }

    function showMessage(msg, duration = 3000) {
        $('#message').text(msg).removeClass('hide').addClass('show');
        setTimeout(() => {
            $('#message').removeClass('show').addClass('hide');
            setTimeout(() => {
                $('#message').text('').removeClass('hide');
            }, 500);
        }, duration);
    }

    $(document).on('click', '.disc', onDiscClick);
    $(document).on('mousemove', onDiscMove);
    $(document).on('click', onDiscDrop);

    $('#reset-button').click(function (e) {
        if (floatingDisc) {
            floatingDisc.remove();
            floatingDisc = null;
        }
        isDragging = false;
        selectedDiscSize = null;
        selectedFromTower = null;
        clearInterval(timerInterval);
        initGame();
        e.stopPropagation();
    });

    initGame();
});
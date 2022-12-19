window.mobileDetection = {
    Android:function () {
        return (/Android/i).test(navigator.userAgent);
    },
    BlackBerry:function () {
        return (/BlackBerry/i).test(navigator.userAgent);
    },
    iOS:function () {
        return (/iPhone|iPad|iPod/i).test(navigator.userAgent);
    },
    Opera:function () {
        return (/Opera Mini/i).test(navigator.userAgent);
    },
    Windows:function () {
        return (/IEMobile/i).test(navigator.userAgent);
    },
    any:function () {
        window.isMobile = $(window).width() <= 1200;
    }
};

mobileDetection.any();

$.fn.extend({
    disableSelection: (function() {
        var eventType = "onselectstart" in document.createElement( "div" ) ?
            "selectstart" :
            "mousedown";

        return function() {
            return this.bind( eventType + ".ui-disableSelection", function( event ) {
                event.preventDefault();
            });
        };
    })()
});

var scale, marginTop, marginLeft;
function checkRatio() {
    if ($(window).height()/$(window).width() >= 0.75) {
        scale = $(window).width()/816;
        marginTop = ($(window).height() - 612*scale)/2;
        marginLeft = 0;
    } else {
        scale = $(window).height()/612;
        marginTop = 0;
        marginLeft = ($(window).width() - 816*scale)/2;
    }
    $('.wrapper').css({
        '-webkit-transform': 'scale(' + scale + ')',
        '-ms-transform': 'scale(' + scale + ')',
        'transform': 'scale(' + scale + ')',
        'margin-top': marginTop,
        'margin-left': marginLeft,
        'visibility': 'visible'
    });
}

var betArr = [];
var denominationArr = [];
var runesToStart;

function initGame() {
    $.ajax({
        url: '../api/init',
        success: function (data) {
            $('.page-loader').hide();
            betArr = data.spin_bet_values;
            denominationArr = data.spin_denomination_values;

            runesToStart = data.runes_to_start;
            $('#runesBar').animate({'width': data.runes_balance/runesToStart*100 + '%'}, 500);
            $('#runesBalance').data('runes-balance', data.runes_balance);
            checkLottery(data.runes_balance);
        },
        error: function () {            
            $('.page-loader').hide();
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');           
        }
    });
}

function setMinValues() {
    $.ajax({
        url: '../api/setMinValues',
        success: function (data) {

            $('#bet-field').text(data.denomination.bet_coins);
            $('#denomination-field').text(data.denomination.denomination);
            $('#currentBetSize').text(data.denomination.bet_real);
            $('#gameBalance').text(data.denomination.coins_balance);

            if (data.denomination.bet_real > parseFloat($('#realBalance').text())) {
                $('.modal.show').modal('hide');
                $('.info-text').html(Translator.trans('Please top up your balance'));
                $('#informModal').modal('show');
            } else {
                checkBetBalance();
            }
        },
        error: function () {
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');           
        }
    });
}

function checkBetBalance(count) {
    var prevBet, nextBet, currBet, currBetIndex, customBetIndex, prevDenom, nextDenom, currDenom, currDenomIndex, balance;
    var addRate = $('#spinAfter')[0].checked ? 1+1/3 : 1;
    currBet = $('#bet-field').text();

    if (betArr.indexOf(currBet) >= 0) {
        currBetIndex = betArr.indexOf(currBet);
        nextBet = betArr[currBetIndex + 1];
    } else {
        for (var i = 0; i < betArr.length; i++) {            
            if (parseFloat(betArr[i]) > parseFloat(currBet)) {
                customBetIndex = i;
                break;
            } else {
                customBetIndex = i + 1;
            }
        }
        nextBet = betArr[customBetIndex];
    }
    currDenom = $('#denomination-field').text();
    currDenomIndex = denominationArr.indexOf(currDenom);
    nextDenom = denominationArr[currDenomIndex + 1];
    balance = parseFloat($('#realBalance').text())/addRate;

    if (Math.floor(currBet*currDenom*100)/100 > balance) {

        for (
            var betCounter =
                currBetIndex ?
                currBetIndex - 1 :
                customBetIndex - 1;
            betCounter >=0;
            betCounter--
        ) {
            if (betArr[betCounter]*currDenom <= balance) {
                sendValue($('.bet-item').data('action'), betArr[betCounter], $('.bet-item .minus'), 'bet');
                return;
            }
        }

        for (
            var denomCounter = currDenomIndex - 1;
            denomCounter >=0;
            denomCounter--
        ) {
            if (denominationArr[denomCounter]*currBet <= balance) {
                sendValue(
                    $('.denomination-item').data('action'),
                    denominationArr[betCounter],
                    $('.denomination-item .minus'),
                    'denomination'
                );
                return;
            }
        }

        setMinValues();

    } else {
        if (currBetIndex == 0) {
            $('.bet-item .minus').addClass('control-disable');
        } else {
            $('.bet-item .minus').removeClass('control-disable');
        }
        if (
            nextBet*currDenom > balance ||
            currBetIndex + 1 == betArr.length ||
            customBetIndex > betArr.length
        ) {
            $('.bet-item .plus').addClass('control-disable');
        } else {
            $('.bet-item .plus').removeClass('control-disable');
        }

        if (currDenomIndex == 0) {
            $('.denomination-item .minus').addClass('control-disable');
        } else {
            $('.denomination-item .minus').removeClass('control-disable');
        }

        if (nextDenom*currBet > balance || currDenomIndex + 1 == denominationArr.length) {
            $('.denomination-item .plus').addClass('control-disable');
        } else {
            $('.denomination-item .plus').removeClass('control-disable');
        }

        if (count && count > 0) {
            count--;
            $('.modal.show').modal('hide');
            startSpin(count);
        }
    }
}

function setValue(el) {
    var dir = $(el).data('dir');
    var parameter = $(el).data('parameter');
    var newValue;
    var arr = parameter == 'bet' ? betArr : denominationArr;
    var currValue = $('#' + parameter + '-field').text();
    var current, custom;
    if (arr.indexOf(currValue) >= 0) {
        current = arr.indexOf(currValue);
    } else {
        for (var i in arr) {
            if (parseFloat(arr[i]) > parseFloat(currValue)) {
                custom = i;
                break;
            } else {
                custom = parseInt(i) + 1;
            }
        }
    }    

    if (dir == 'more' && current < arr.length - 1) {
        newValue = arr[++current];
    } else if (dir == 'less' && current > 0) {
        newValue = arr[--current];
    }

    if (dir == 'more' && custom < arr.length - 1) {
        newValue = arr[custom];
    } else if (dir == 'less' && custom > 0) {
        newValue = arr[--custom];
    }

    if (newValue) {
        var url = $(el).closest('.set-item').data('action');
        $(el).closest('.set-item').find('.value-text').hide();
        $(el).closest('.set-item').find('.load').show();
        $('.dashboard').addClass('disable');

        sendValue(url, newValue, el, parameter, betArr, denominationArr);
    }    
}

function sendValue(url, newValue, el, parameter) {
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: '[ ' + newValue + ' ]',
        cache: false,
        timeout: 100000,
        success: function(data){
            $(el).closest('.set-item').find('.value-text').show();
            $(el).closest('.set-item').find('.load').hide();
            $('.dashboard').removeClass('disable');
            if (data.status == 0) {
                if (parameter == 'bet') {
                    $('#bet-field').text(data.bet_coins);
                    $('#currentBetSize').text(data.bet_real);
                } else {
                    $('#denomination-field').text(data.denomination);
                    $('#gameBalance').text(data.coins_balance);
                    $('#currentBetSize').text(data.bet_real);
                }
                checkBetBalance();
            }
            else if (data.status == 3) {
                $('.info-text').html(Translator.trans('Not enough money to set the bet.'));
                $('#informModal').modal('show');
            } else {
                $('.info-text').html(Translator.trans('Error. Please try again later!'));
                $('#informModal').modal('show');
            }

        },
        error: function () {
            $(el).closest('.set-item').find('.value-text').show();
            $(el).closest('.set-item').find('.load').hide();
            $('.dashboard').removeClass('disable');
            $('.info-text').empty();
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');
        }
    });
}

function refreshBalance(runesWin, count) {
    $.ajax({
        url: $('#realBalance').attr("data-url"),
        type: 'get',
        cache: false,
        timeout: 100000,
        success: function (data) {
            if (data.status == 0) {
                $('#currentBetSize').html(data.current_bet_real_size);
                $('#realBalance').html(data.real_balance);
                $('#gameBalance').html(data.coins_balance);
                $('#denomination-field').text(data.denomination_balance);
                if (runesWin) {
                    function runesFrame() {
                        time += 1 / fps;
                        position = easeInOutQuad(time * 100 / runesDuration, time, start, finish, runesDuration);
                        opacity = Math.round((Math.abs(position - Math.round(position)))*100)/50;

                        if (position >= finish) {
                            clearInterval(handler);
                            barBalance.text(runesOld + finish);
                            barEl.css({'width': (runesOld + finish)/runesToStart*100 + '%'});
                            barPulse.css({'opacity': 0});
                            return;
                        }

                        popupEl.text(Math.round(finish - position));
                        barBalance.text(Math.round(runesOld + position));
                        barEl.css({'width': (runesOld + position)/runesToStart*100 + '%'});
                        barPulse.css({'opacity': opacity});
                    }

                    var fps = 60,
                        runesDuration = 2, // seconds
                        start = 0,
                        runesOld = parseInt($('#runesBalance').text()),
                        finish = runesWin,
                        position = start,
                        time = 0,
                        opacity = 0,
                        handler = setInterval(runesFrame, 1000 / fps),
                        barBalance = $('#runesBalance'),
                        popupEl = $('.show .runes-value'),
                        barEl = $('#runesBar'),
                        barPulse = $('.runes-bar-pulse');
                } else {
                    $('#runesBalance')
                        .text(data.runes_balance)
                        .data('runes-balance', data.runes_balance);
                    $('#runesBar').animate({'width': data.runes_balance/runesToStart*100 + '%'}, 500);
                }
                checkLottery(data.runes_balance, count);
            }
        },
        error: function () {
            $('.info-text').empty();
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');
        }
    });
}

function easeInOutQuad(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
        return c / 2 * t * t + b;
    } else {
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
}

var duration = 6000;
var girlDuration = 1000;
var goblinDuration = 4000;

function checkTurbo() {
    if ($('#turbo').is(':checked')) {
        duration = 0;
        girlDuration = 0;
        goblinDuration = 0;
    } else {
        duration = 6000;
        girlDuration = 1000;
        goblinDuration = 4000;
    }
}

function animateGirl() {
    $('.girl').addClass('girl-animate');
    setTimeout(function(){
        $('.girl').removeClass('girl-animate');
    }, girlDuration);
}

function animateGoblin() {
    $('.goblin').addClass('goblin-animate');
    setTimeout(function(){
        $('.goblin').removeClass('goblin-animate');
    }, goblinDuration);
}

function animateWheel(sector, shift) {
    var spin;
    
    if (shift) {
        spin = $('.circle').data('spin') + shift*20;
    } else {
        spin = 2160 + sector*20;
    }
    $('.circle').css({
        transform: 'rotate(' + spin + 'deg)',
        WebkitTransition : 'transform ' + duration/1000 + 's cubic-bezier(.37,.01,.21,.99)',
        MozTransition    : 'transform ' + duration/1000 + 's cubic-bezier(.37,.01,.21,.99)',
        MsTransition     : 'transform ' + duration/1000 + 's cubic-bezier(.37,.01,.21,.99)',
        OTransition      : 'transform ' + duration/1000 + 's cubic-bezier(.37,.01,.21,.99)',
        transition       : 'transform ' + duration/1000 + 's cubic-bezier(.37,.01,.21,.99)',
    });
    setTimeout(function(){
        if (!shift) {
            $('.circle').css({
                transform: 'rotate(' + (spin - 2160) + 'deg)',
                WebkitTransition : 'all 0s ease 0s',
                MozTransition    : 'all 0s ease 0s',
                MsTransition     : 'all 0s ease 0s',
                OTransition      : 'all 0s ease 0s',
                transition       : 'all 0s ease 0s'
            });
        }
        $('.circle').data('sector', sector);
        $('.circle').data('spin', spin - 2160);
    }, duration);
}

function toggleAuto(e) {
    e.preventDefault();
    e.stopPropagation();
    var list = $('.auto-list');
    if (list.is('.auto-list-show')) {
        list.removeClass('auto-list-show');
        $(document).unbind('click');
    } else {
        list.addClass('auto-list-show');
        $(document).click(documentClick);
        $('#spinAfter').prop('checked', false);
    }    
}

function documentClick(e) {
    var container = $('.auto-list');
    if (container.is('.auto-list-show') && container.has(e.target).length === 0 && !container.is(e.target)) {
        container.removeClass('auto-list-show');
        $(document).unbind('click');
    }
}

function spinAfter(el) {
    var url = $(el).data('url');
    $('body').addClass('disable');

    $.ajax({
        url: url,
        type: 'get',
        cache: false,
        timeout: 100000,
        success: function (data) {
            $('.info-text').empty();

            if (data.status == 0 && data.spin_result.slot_num) {
                $('.spin-after').hide();
                animateWheel(data.spin_result.slot_num, data.spin_result.shift);

                setTimeout(function(){
                    var modalEl;
                    $('.win-value').text(data.coins_winning);
                    $('.scoreboard-win-value').text(data.real_winning);
                    $('.runes-value').text(data.runes_winning);

                    switch (data.spin_result.slot_type) {
                        case 1:
                            modalEl = $('#winModal');
                            $('.top').addClass('win');
                            break;
                        case 2:
                            modalEl = $('#slotModal');
                            animateSlots(data.spin_result.slot_data.slot_machine, 'false', data.runes_winning);
                            break;
                        case 3:
                            $('.win-rate').text(data.spin_result.slot_data.value);
                            modalEl = $('#rateModal');
                            $('.top').addClass('win');
                            break;
                        case 4:
                            modalEl = $('#zeroModal');
                            $('.top').addClass('loss');
                            break;
                        default: 
                            modalEl = $('#winModal');
                    }
                    modalEl.modal('show');

                    if (data.spin_result.slot_type != 2) {
                        refreshBalance(data.runes_winning);
                        $('body').removeClass('disable');
                    }
                }, duration);
            }

            if (data.status == 2) {
                $('.info-text').html(Translator.trans('You haven`t purchased this function before spinning.'));
                $('#informModal').modal('show');
                $('body').removeClass('disable');
            }
        },
        error: function () {
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');
            $('body').removeClass('disable');
        }
    })
}

function animateSlots(arr, after, runes, count) {
    $('.slot-item').each(function(index, element){
        var el = $(this);
        var slotImg = ['slot-girl', 'slot-goblin', 'slot-runes', 'slot-mask', 'slot-bird'];
        for (var i = 0; i < 40; i++) {
            el.find('.slot-animated').append($('<div class="slot-frame" style="background-image: url(/i/' + slotImg[Math.floor(Math.random() * 4)] + '.jpg)"></div>'));
        }
        el.find('.slot-animated').append($('<div class="slot-frame" style="background-image: url(/i/' + slotImg[arr[index] - 1] + '.jpg)"></div>'));
        el.find('.slot-animated').animate(
            {
                'top': -40*el.innerHeight()
            },
            duration,
            'easeOutCubic',
            function(){
                if (index == 2) {
                    $('.slot-final').addClass('slot-final-show');
                    $('body').removeClass('disable');
                    if (after == 'true') {
                        $('.spin-after').show();
                        $('#spinAfter').prop('checked', false);
                        refuseSpinAfter(runes, count);
                    } else {
                        refreshBalance(runes, count);
                    }
                    $('.top').addClass('win');                    
                }                
            }
        );

    });
}

function refuseSpinAfter(runes, count) {
    $(document).click(function(e){
        if (
            $('.spin-after').is(':visible') &&
            $('#btn-spin-after').has(e.target).length === 0
            && !$('#btn-spin-after').is(e.target)
        ) {
            $('.spin-after').hide();
            refreshBalance(runes, count);
            $(document).unbind('click');
        }
    });
}

function toggleSounds() {
    $('.sounds a').click(function(e){
        e.preventDefault();
        $(this).toggleClass('off');
    });
}

function startSpin(count) {
    $('body').addClass('disable'); 
    var url = $('#btn-spin').data('url') + '/' + $('#spinAfter')[0].checked;   

    $.ajax({
        url: url,
        type: 'get',
        cache: false,
        timeout: 100000,
        success: function (data) {
            if (data.status == 0 && data.spin_result.slot_num) {
                checkTurbo();
                animateGoblin();
                animateGirl();
                animateWheel(data.spin_result.slot_num, false);

                setTimeout(function(){
                    var modalEl;

                    $('.win-value').text(data.coins_winning);
                    $('.scoreboard-win-value').text(data.real_winning);
                    $('.runes-value').text(data.runes_winning);

                    switch (data.spin_result.slot_type) {
                        case 1:
                            modalEl = $('#winModal');
                            $('.top').addClass('win');
                            break;
                        case 2:
                            modalEl = $('#slotModal');
                            animateSlots(
                                data.spin_result.slot_data.slot_machine,
                                data.spin_after,
                                data.runes_winning,
                                count
                            );
                            break;
                        case 3:
                            $('.win-rate').text(data.spin_result.slot_data.value);
                            modalEl = $('#rateModal');
                            $('.top').addClass('win');
                            break;
                        case 4:
                            modalEl = $('#zeroModal');
                            $('.top').addClass('loss');
                            break;
                        default: 
                            modalEl = $('#winModal');
                    }                        

                    modalEl.modal('show');

                    if (
                        data.spin_after == 'true' &&
                        data.spin_result.slot_type != 2
                    ) {
                        $('.spin-after').show();                            
                        $('#spinAfter').prop('checked', false);
                        refuseSpinAfter(data.runes_winning, count);
                    } else if (data.spin_result.slot_type != 2) {
                        refreshBalance(data.runes_winning, count);
                    }
                    if (data.spin_result.slot_type != 2) {
                        $('body').removeClass('disable');
                    }
                    
                }, duration);
            }

            if (data.status == 1) {
                $('.slice').css({background: 'white'});
                $('.info-text').html(Translator.trans('Not enough money to set the bet.'));
                $('#informModal').modal('show');                    
                $('body').removeClass('disable');
            }

            if (data.status == 2) {
                $('.slice').css({background: 'white'});
                $('.info-text').html(Translator.trans('Not enough in-game currency to spin the wheel!'));
                $('#informModal').modal('show');                    
                $('body').removeClass('disable');
            }
        },
        error: function () {       
            $('.info-text').empty();
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');
            $('body').removeClass('disable');             
        }
    });
}

function checkLottery(currentRunes, count) {
    if (currentRunes >= runesToStart) {
        $('.modal.show').modal('hide');
        $('.dashboard').hide();
        $('.bonus-lottery').show();
        count = undefined;
    }
    checkBetBalance(count);
}

function chooseLottery() {
    $('.table').on('click', '.cell', function(){
        $(this).toggleClass('cell-active');
        $('.chosen-count').text($('.cell-active').length);
        if ($('.cell-active').length == 6) {
            $('.cell:not(.cell-active)').addClass('disable');
            $('.start-lottery').removeClass('disable');
        } else {
            $('.cell:not(.cell-active)').removeClass('disable');
            $('.start-lottery').addClass('disable');
        }
    });
}

function clearLottery() {
    $('.cell-active').removeClass('cell-active');
    $('.start-lottery:not(.disable)').addClass('disable');
    $('.chosen-count').text('0');
    $('.cell.disable').removeClass('disable');
}

function chooseAuto() {
    $('.cell-active').removeClass('cell-active');
    var rand;
    var autoArr = [];
    for (var i = 0; i < 6; i++) {
        rand = 1 + Math.random() * 36;
        rand = Math.floor(rand);
        if (autoArr.indexOf(rand) === -1) {
            autoArr.push(rand);
            $('.cell:nth-child(' + rand + ')').addClass('cell-active');
        } else {
            i--;
        }        
    }
    $('.chosen-count').text('6');
    $('.cell.disable').removeClass('disable');
    $('.start-lottery.disable').removeClass('disable');
    $('.cell:not(.cell-active)').addClass('disable');
}

function startLottery() {    
    var url = $('.start-lottery').data('url');
    var bl_arr = [];
    $('.cell-active').each(function(){
        bl_arr.push($(this).text());
    });

    var bl_values = '[' + bl_arr.join(',') + ']';

    $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: bl_values,
        cache: false,
        timeout: 100000,
        success: function(data){

            if (data.status == 0) {

                var ballsAside = $('.bonus-result-item'),
                    ballsDrop = $('.ball-text');
                for (var i = 0; i < 6; i++) {
                    $(ballsAside[i]).text(data.bl_result[i + 1]);
                    $(ballsDrop[i]).text(data.bl_result[i + 1]);
                }                

                $('.lototron').addClass('lototron-animate disable');
                $('.bonus-result-list').addClass('bonus-result-animate');
                $('.modal-lottery .match-value').text(data.matched_count);
                $('.modal-lottery .lottery-coins-value').text(data.coins_winning);
                setTimeout(function(){
                    $('#lotteryModal').modal('show');
                    $('#lotteryModal').click(function(){
                        $('#lotteryModal').modal('hide');
                        $('.dashboard').show();
                        $('.bonus-lottery').hide();
                        $('.lototron').removeClass('lototron-animate disable');
                        $('.bonus-result-list').removeClass('bonus-result-animate');
                        clearLottery();
                        refreshBalance();
                    });
                }, 19000);
                
            } else {
                $('.info-text').empty();
                $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
                $('#informModal').modal('show');
            }
        },
        error: function () {
            $('.info-text').empty();
            $('.info-text').html(Translator.trans('Send data error detected. Please try again later.'));
            $('#informModal').modal('show');
        }
    });
}

$(document).ready(function() {
    checkRatio();
    initGame();
    toggleSounds();
    $('.test').click(setMinValues);
    $('#spinAfter').on('change', function(){
        checkBetBalance();
    });
    $('.modal-dialog').click(function(){
        $(this).closest('.modal').modal('hide');
    });
    $('#slotModal').on('hidden.bs.modal', function () {
        $('.slot-animated').each(function(){
            $(this).empty().css('top', 0);
            $('.slot-final').removeClass('slot-final-show');
        });
    });
    $('.modal').on('hidden.bs.modal', function () {
        $('.top').removeClass('win').removeClass('loss');
    });
    $('.dashboard').click(function(){
        if ($('.modal.show').length) {
            $('.modal.show').modal('hide');
        }
    });
    $('.auto-button').click(toggleAuto);
    $('.set-val').click(function() {
        setValue($(this));
    }).disableSelection();
    $('button').disableSelection();

    $('#btn-spin-after').on('click', function() {
        $(document).unbind('click');
        $('.spin-after').hide();
        spinAfter($(this));
    });      

    $('#btn-all-in').on('click', function () {
        $('.bet-item .value-text').hide();
        $('.bet-item .load').show();
        var addRate = $('#spinAfter')[0].checked ? 1+1/3 : 1;
        var val = Math.floor(
            parseFloat(
                $('#realBalance').text()/
                $('#denomination-field').text()
            )/
            addRate*
            100
        )/100;
        sendValue(
            $('.bet-item').data('action'),
            val,
            $('.bet-item .minus'),
            'bet'
        );
    });

    $('#btn-spin').on('click', function (e) {
        var url = $(e.target).data('url') + '/' + $('#spinAfter')[0].checked;
        startSpin();
    });

    $('.spin-times').on('click', function () {
        $('.auto-list').removeClass('auto-list-show');
        startSpin($(this).data('count') - 1);
    });

    chooseLottery();
    $('.clear-lottery').click(clearLottery);
    $('.auto-choose').click(chooseAuto);
    $('.cell').disableSelection();
    $('.start-lottery').click(startLottery);
});

$(window).on('resize', function(){
    checkRatio();
});
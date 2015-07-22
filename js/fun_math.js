var Type = {
  PLAYER: "player",
  FOLLOWER: "follower"
}

var Currency = {
  CAP: 1,
  NCR_5: 2,
  NCR_20: 8,
  NCR_100: 40,
  DENARIUS_MANGLED: 2,
  DENARIUS: 4,
  AUREUS: 100
};

function math(base, currency_worth, currency_amount) {
  var old_amount = currency_amount;
  while (base >= currency_worth && currency_amount > 0) {
    base -= currency_worth;
    currency_amount -= 1;
  }
  return [base, currency_amount, old_amount - currency_amount];
}

function pay(cost, useCaps) {
  if (useCaps == undefined) {
    useCaps = false;
  }
  var ncrFives = or(getPlayerStat('5_bills'), 0);
  var ncrTwenties = or(getPlayerStat('20_bills'), 0);
  var ncrHundreds = or(getPlayerStat('100_bills'), 0);
  var legDenariiMangled = or(getPlayerStat('denarii_mangled'), 0);
  var legDenarii = or(getPlayerStat('denarii'), 0);
  var legAurei = or(getPlayerStat('aurei'), 0);
  var caps = or(getPlayerStat('bottle_caps'), 0);
  useCaps &= caps != 0;
  if (useCaps) {
    cost -= caps;
    addToCost = caps;
  }
  var needed = {};
  [cost, unused, needed.aurei] = math(cost, 100, legAurei);
  [cost, unused, needed.hundreds] = math(cost, 40, ncrHundreds);
  [cost, unused, needed.twenties] = math(cost, 8, ncrTwenties);
  [cost, unused, needed.denarii] = math(cost, 4, legDenarii);
  [cost, unused, needed.fives] = math(cost, 2, ncrFives);
  [cost, unused, needed.denariiMangled] = math(cost, 2, legDenariiMangled);
  needed.caps = useCaps ? cost + addToCost : cost;
  return needed;
} // TODO: Make math modal

function clearPaymentCurrencies() {
  $('#payment_currencies').empty();
}

function addPaymentCurrency(value, name) {
  $('#payment_currencies').append('<div class="ui mini statistic"><div class="value">' + value + '</div><div class="label">' + name + '</div></div>');
}

function getCurrencyName(internal) {
  switch (internal) {
    case 'aurei':
      return 'Legion Aurei';
    case 'hundreds':
      return 'NCR $100';
    case 'twenties':
      return 'NCR $20';
    case 'denarii':
      return 'Legion Denarii';
    case 'fives':
      return 'NCR $5';
    case 'denariiMangled':
      return 'Legion Denarii, mangled'
    case 'caps':
      return 'Caps';
  }
}

function displayCost(cost, useCaps) {
  clearPaymentCurrencies();
  var needed = pay(cost, useCaps);
  for (currency in needed) {
    var amount = needed[currency];
    if (amount == 0) continue;
    addPaymentCurrency(amount, getCurrencyName(currency));
  }
}

function carryWeight(lvl, end, strength, armor) {
  var c = (lvl + 100) * ((766388 * Math.log(end)) + (383194 * Math.log(strength)) + 184269);
  c /= 5000000;
  var w = 10000000 * armor;
  w /= end * (end * ((307039 * end) - 7889300) + 72577100) - 262941000;
  return Math.round(c - w);
}

function getPlayerStat(stat) {
  return getStat(Type.PLAYER, stat);
}

function getFollowerStat(stat) {
  return getStat(Type.FOLLOWER, stat);
}

function getStat(type, stat) {
  var prepend = '';
  if (type == Type.FOLLOWER) prepend = 'follower_';
  return parseInt($('#' + prepend + stat).val());
}

function followerIndex(lvl, cha, per, lck) {
  return Math.floor((1 + lvl / 100) * (cha * per / 2) + lck);
}

function follower(cha, per) {
  return Math.round(cha * per);
}

function noneAreNaN(arr) {
  return arr.length == arr.filter(function(a) { return !isNaN(a); }).length;
}

function getFollowerIndex() {
  var level = getPlayerStat('level');
  var cha = getPlayerStat('charisma');
  var per = getPlayerStat('perception');
  var lck = getPlayerStat('luck');
  if (!noneAreNaN([level, cha, per, lck])) {
    return NaN;
  }
  return followerIndex(level, cha, per, lck);
}

function getFollower() {
  var fCha = getFollowerStat('charisma');
  var fPer = getFollowerStat('perception');
  if (!noneAreNaN([fCha, fPer])) {
    return NaN;
  }
  return follower(fCha, fPer);
}

function checkFollower() {
  updateCarryWeight(Type.FOLLOWER);
  var icon = $('#follower_icon');
  var fInd = getFollowerIndex();
  var f = getFollower();
  if (!noneAreNaN([fInd, f])) {
    icon.removeClass("black red green");
    icon.addClass("black");
    return;
  }
  if (fInd > f) {
    icon.removeClass("black red green");
    icon.addClass("green");
  } else {
    icon.removeClass("black red green");
    icon.addClass("red");
  }
}

function saveButton() {
    Cookies.set('saved_data', saveData());
    cycleButton('save_button', 'Done');
}

function cycleButton(id, tempText) {
    var content = $('#' + id + ' > div');
    var normalText = content.text();
    content.transition('scale', '150ms', function() {
      content.text(tempText);
    });
    setTimeout(function() {
        content.transition('scale', '150ms')
    }, 150);
    setTimeout(function() {
        content.transition('scale', '150ms', function() {
          content.text(normalText);
        })
    }, 1650);
    setTimeout(function() {
        content.transition('scale', '150ms')
    }, 1800);
}

function generateSPECIALObject(str, per, end, cha, inte, agl, lck, follower) {
  if (follower == undefined) {
    follower = false;
  }
  var special = {
    'strength': str,
    'perception': per,
    'endurance': end,
    'charisma': cha,
    'intelligence': inte,
    'agility': agl,
    'luck': lck
  };
  if (!follower) return special;
  var followerSpecial = {}
  $.each(special, function (name, value) {
    followerSpecial['follower_' + name] = value;
  });
  return followerSpecial;
}

var followers = {
  'arcade': generateSPECIALObject(6, 6, 4, 6, 10, 6, 4, true),
  'boone': generateSPECIALObject(7, 8, 5, 1, 3, 7, 6, true),
  'lily': generateSPECIALObject(9, 3, 8, 5, 3, 10, 6, true),
  'raul': generateSPECIALObject(6, 6, 4, 2, 7, 8, 5, true),
  'cass': generateSPECIALObject(7, 7, 4, 4, 4, 6, 4, true),
  'veronica': generateSPECIALObject(7, 5, 6, 3, 6, 7, 3, true),
  'ede': generateSPECIALObject(6, 10, 5, 5, 5, 7, 9, true),
  'none': generateSPECIALObject('', '', '', '', '', '', '', true)
}

var SaveRunner = function() {
  this.intervalID = undefined;
}

SaveRunner.prototype.run = function() {
  if (this.intervalID != undefined) return;
  this.intervalID = setInterval(saveButton, 180000);
};

SaveRunner.prototype.cancel = function() {
  if (this.intervalID == undefined) return;
  clearInterval(this.intervalID);
  this.intervalID = undefined;
}

var saveRunner = new SaveRunner();

function or(num, other) {
  if (isNaN(num)) {
    return other;
  } else {
    return num;
  }
}

function sumCoins() {
  var aurei = or(getPlayerStat('aurei'), 0);
  var denarii = or(getPlayerStat('denarii'), 0);
  var denariiMangled = or(getPlayerStat('denarii_mangled'), 0);
  var sum = aurei + denarii + denariiMangled;
  $('#coins').val(sum == 0 ? '' : sum);
  updateCarryWeight(Type.PLAYER);
}

function sumBills() {
  var hundreds = or(getPlayerStat('100_bills'), 0);
  var twenties = or(getPlayerStat('20_bills'), 0);
  var fives = or(getPlayerStat('5_bills'), 0);
  var sum = hundreds + twenties + fives;
  $('#bills').val(sum == 0 ? '' : sum);
  updateCarryWeight(Type.PLAYER);
}

$(function() {
  $('input').on('input', function() {
    processInformation();
  });
  $('#save_button').click(saveButton);
  $('#load_button').click(function() {
    loadData(Cookies.getJSON('saved_data'));
    cycleButton('load_button', 'Done');
  });
  $('.ui.sticky').sticky({
    context: '.grid-70'
  });
  $('#caps_help').popup({
    html: '<p>The weight of your currency is subtracted from your max carry weight in order to show the amount other items can use.</p><p>One cap is one two-hundredth of a pound.</p>'
  });
  $('#bills_help').popup({
    html: '<p>The weight of your currency is subtracted from your max carry weight in order to show the amount other items can use.</p><p>One bill is one five-hundredth of a pound.</p>'
  });
  $('#coins_help').popup({
    html: '<p>The weight of your currency is subtracted from your max carry weight in order to show the amount other items can use.</p><p>One coin is thirteen thousandths of a pound.</p>'
  });
  $('#save_button').popup({'hoverable': true});
  $('#save_toggle').popup({
    content: 'Toggles autosave, which occurs every three minutes when enabled.'
  });
  $('#bills_input').popup({'hoverable': true});
  $('#coins_input').popup({'hoverable': true});
  $('#save_toggle').checkbox({
    onChecked: function() {
      saveRunner.run();
    },
    onUnchecked: function() {
      saveRunner.cancel();
    }
  });
  $('#payment_use_caps_first_parent').checkbox({
    onChecked: function() {
      displayCost(or(getPlayerStat('cost'), 0), $('#payment_use_caps_first').prop('checked'));
    },
    onUnchecked: function() {
      displayCost(or(getPlayerStat('cost'), 0), $('#payment_use_caps_first').prop('checked'));
    }
  });
  $('#currency_header').popup({'hoverable': true});
  $('#aurei, #denarii, #denarii_mangled').on('input', function() {
    sumCoins();
  });
  $('#100_bills, #20_bills, #5_bills').on('input', function() {
    sumBills();
  });
  $('#cost').on('input', function() {
    displayCost(or(getPlayerStat('cost'), 0), $('#payment_use_caps_first').prop('checked'));
  });
  $('.ui.selection.dropdown').dropdown({
    action: 'activate',
    onChange: function(value, text, $selectedItem) {
      if (!followers.hasOwnProperty(value)) return;
      $('#follower_header').popup({
        onVisible: function() {
          $('#follower_dismiss_button').transition('flash');
        }
      });
      $('#follower_header').popup('show');
      setTimeout(function() {
        $('#follower_header').popup('hide');
        $('#follower_header').popup({
          'onVisible': undefined,
          'hoverable': true
        });
      }, 1500);
      $('#follower_special').form('set values', followers[value]);
      checkFollower();
    }
  });
  $('#follower_dismiss_button').click(function() {
    $('#follower_header').popup('destroy');
    $('#follower_dropdown').dropdown('clear');
    $('#follower_special').form('set values', followers['none']);
    checkFollower();
  });
  processInformation();
});

function getCurrencyWeight(type) {
  return (getCapsWeight(type) + getBillsWeight(type) + getCoinsWeight(type)).toFixed(2);
}

function getBillsWeight(type) {
  var bills = getStat(type, 'bills');
  if (isNaN(bills)) {
    return 0;
  }
  return bills / 500;
}

function getCoinsWeight(type) {
  var coins = getStat(type, 'coins');
  if (isNaN(coins)) {
    return 0;
  }
  return coins * (13 / 1000);
}

function getCapsWeight(type) {
  var caps = getStat(type, 'bottle_caps');
  if (isNaN(caps)) {
    return 0;
  }
  return caps / 200;
}

function updateCarryWeight(type) {
  var end = getStat(type, 'endurance');
  var str = getStat(type, 'strength');
  var level = getStat(Type.PLAYER, 'level');
  var armorWeight = getStat(type, 'armor_weight');
  if (isNaN(armorWeight)) {
    armorWeight = 0;
  }
  var maxCarryWeight = $('#' + (type == Type.FOLLOWER ? 'follower_' : '') + 'max_carry_weight');
  if (!noneAreNaN([end, str, level, armorWeight])) {
    maxCarryWeight.text('0');
    return;
  }
  var oldText = maxCarryWeight.text();
  var newText = carryWeight(level, end, str, armorWeight) - getCurrencyWeight(type);
  maxCarryWeight.text(newText);
  if (oldText != newText) {
    maxCarryWeight.transition({
      'animation': 'pulse',
      'queue': false
    });
  }
}

function saveData() {
  saveRunner.cancel();
  saveRunner.run();
  var data = {
    'fields': {}
  };
  $('input').each(function(i, input) {
    data.fields[input.id] = input.value;
  });
  return data;
}

function loadData(data) {
  if (data == undefined) return;
  saveRunner.cancel();
  var fields = data.fields;
  $.each(fields, function(id, value) {
    if (!id) return;
    $('input#' + id).val(value);
  });
  if (fields.hasOwnProperty('selected_follower')) {
    var selectedFollower = fields['selected_follower'];
    if (selectedFollower) {
      $('#follower_dropdown').dropdown('set selected', fields['selected_follower']);
      $('#follower_header').popup({'hoverable': true});
    }
  }
  if (fields.hasOwnProperty('internal_save_toggle') && fields['internal_save_toggle'] == 'on') {
    $('#save_toggle').checkbox('check');
  }
  if (fields.hasOwnProperty('payment_use_caps_first') && fields['payment_use_caps_first'] == 'on') {
    $('#payment_use_caps_first_parent').checkbox('check');
  }
  processInformation();
  sumCoins();
  sumBills();
}

function processInformation() {
  checkFollower();
  updateCarryWeight(Type.PLAYER);
  updateCarryWeight(Type.FOLLOWER);
}

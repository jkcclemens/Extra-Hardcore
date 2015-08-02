(function() {
  var PaymentCalculator, SaveRunner, root;

  root = this;

  this.Type = {
    PLAYER: 'player',
    FOLLOWER: 'follower'
  };

  this.CurrencyType = {
    CAPS: {
      id: 'bottle_caps',
      getWeight: function() {
        return root.getCapsWeight();
      },
      getValue: function() {
        return root.getPlayerStatZero('bottle_caps');
      }
    },
    BILLS: {
      id: 'bills',
      getWeight: function() {
        return root.getBillsWeight();
      }
    },
    COINS: {
      id: 'coins',
      getWeight: function() {
        return root.getCoinsWeight();
      }
    }
  };

  $.each(CurrencyType, function(name, content) {
    content.getField = function() {
      return $('#' + content.id);
    };
    if (!content.hasOwnProperty('getValue')) {
      return content.getValue = function() {
        var value;
        value = 0;
        this.getField().parent().siblings('.popup').find('.value.label').each(function(i, element) {
          value += numberFromFormat($(element).text());
          return true;
        });
        return value;
      };
    }
  });

  this.Currency = {
    CAP: {
      name: 'Cap',
      plural: 'Caps',
      value: 1,
      id: 'bottle_caps'
    },
    NCR_5: {
      name: 'NCR $5',
      plural: 'NCR $5',
      value: 2,
      id: '5_bills'
    },
    NCR_20: {
      name: 'NCR $20',
      plural: 'NCR $20',
      value: 8,
      id: '20_bills'
    },
    NCR_100: {
      name: 'NCR $100',
      plural: 'NCR $100',
      value: 40,
      id: '100_bills'
    },
    DENARIUS_MANGLED: {
      name: 'Denarius, mangled',
      plural: 'Denarii, mangled',
      value: 2,
      id: 'denarii_mangled'
    },
    DENARIUS: {
      name: 'Denarius',
      plural: 'Denarii',
      value: 4,
      id: 'denarii'
    },
    AUREUS: {
      name: 'Aureus',
      plural: 'Aurei',
      value: 100,
      id: 'aurei'
    },
    values: function() {
      var property, values;
      values = [];
      for (property in Currency) {
        if (!Currency.hasOwnProperty(property)) {
          continue;
        }
        if (property !== property.toUpperCase()) {
          continue;
        }
        values.push(Currency[property]);
      }
      return values;
    },
    sorted: function() {
      return this.values().sort(function(a, b) {
        if (a.value === b.value) {
          return 0;
        }
        if (a.value > b.value) {
          return -1;
        } else {
          return 1;
        }
      });
    },
    getByProperty: function(property, value) {
      var j, len, v, values;
      values = this.values();
      for (j = 0, len = values.length; j < len; j++) {
        v = values[j];
        if (v[property] === value) {
          return v;
        }
      }
      return void 0;
    },
    getByName: function(name) {
      return this.getByProperty('name', name);
    },
    getByID: function(id) {
      return this.getByProperty('id', id);
    }
  };

  $.each(Currency.values(), function(name, content) {
    content.getName = function(amount) {
      if (amount === 1) {
        return content.name;
      } else {
        return content.plural;
      }
    };
    return true;
  });

  this.CurrencyMath = (function() {
    function CurrencyMath() {}

    CurrencyMath.math = function(base, currencyWorth, currencyAmount) {
      var oldAmount;
      oldAmount = currencyAmount;
      while (base >= currencyWorth && currencyAmount > 0) {
        base -= currencyWorth;
        currencyAmount -= 1;
      }
      return [base, currencyAmount, oldAmount - currencyAmount];
    };

    CurrencyMath.pay = function(cost, useCaps) {
      var addToCost, caps, currency, j, len, needed, ref, sorted, unused;
      if (useCaps == null) {
        useCaps = false;
      }
      caps = getPlayerStatZero('bottle_caps');
      useCaps &= caps !== 0;
      addToCost = 0;
      if (useCaps) {
        cost -= caps;
        addToCost = caps;
      }
      needed = {};
      sorted = Currency.sorted();
      for (j = 0, len = sorted.length; j < len; j++) {
        currency = sorted[j];
        if (currency !== Currency.CAP) {
          ref = this.math(cost, currency.value, getPlayerStatZero(currency.id)), cost = ref[0], unused = ref[1], needed[currency.id] = ref[2];
        }
      }
      needed.bottle_caps = useCaps ? cost + addToCost : cost;
      return needed;
    };

    return CurrencyMath;

  })();

  SaveRunner = (function() {
    function SaveRunner() {
      this.intervalID = void 0;
    }

    SaveRunner.prototype.run = function() {
      if (this.intervalID == null) {
        return this.intervalID = setInterval(saveButton, 180000);
      }
    };

    SaveRunner.prototype.cancel = function() {
      if (this.intervalID != null) {
        clearInterval(this.intervalID);
        return this.intervalID = void 0;
      }
    };

    return SaveRunner;

  })();

  PaymentCalculator = (function() {
    function PaymentCalculator() {}

    PaymentCalculator.clearPaymentCurrencies = function() {
      return $('#payment_currencies').empty();
    };

    PaymentCalculator.addPaymentCurrency = function(value, name) {
      return $('#payment_currencies').append("<div class=\"ui statistic\"><div class=\"value\">" + value + "</div><div class=\"label\">" + name + "</div></div>");
    };

    PaymentCalculator.displayCost = function(cost, useCaps) {
      var needed;
      PaymentCalculator.clearPaymentCurrencies();
      needed = CurrencyMath.pay(cost, useCaps);
      return $.each(needed, function(name, amount) {
        var currency;
        if (amount === 0) {
          return;
        }
        currency = Currency.getByID(name);
        PaymentCalculator.addPaymentCurrency(amount, currency.getName(amount));
        return true;
      });
    };

    PaymentCalculator.displayNormalCost = function() {
      return PaymentCalculator.displayCost(getPlayerStatZero('cost'), $('#payment_use_caps_first').prop('checked'));
    };

    return PaymentCalculator;

  })();

  this.saveRunner = new SaveRunner();

  this.carryWeight = function(level, endurance, strength, armor) {
    var c, w;
    c = (level + 100) * ((766388 * Math.log(endurance)) + (383194 * Math.log(strength)) + 184269);
    c /= 5000000;
    w = 10000000 * armor;
    w /= endurance * (endurance * ((307039 * endurance) - 7889300) + 72577100) - 262941000;
    return Math.round(c - w);
  };

  this.getPlayerStat = function(stat) {
    return getStat(Type.PLAYER, stat);
  };

  this.getFollowerStat = function(stat) {
    return getStat(Type.FOLLOWER, stat);
  };

  this.getStat = function(type, stat) {
    var prepend;
    if (type == null) {
      type = Type.PLAYER;
    }
    prepend = '';
    if (type === Type.FOLLOWER) {
      prepend = 'follower_';
    }
    return parseInt($('#' + prepend + stat).val());
  };

  this.followerIndex = function(lvl, cha, per, lck) {
    return Math.floor((1 + lvl / 100) * (cha * per / 2) + lck);
  };

  this.follower = function(cha, per) {
    return Math.round(cha * per);
  };

  this.noneAreNaN = function(arr) {
    return arr.length === arr.filter(function(a) {
      return !isNaN(a);
    }).length;
  };

  this.getFollowerIndex = function() {
    var cha, lck, level, per;
    level = getPlayerStat('level');
    cha = getPlayerStat('charisma');
    per = getPlayerStat('perception');
    lck = getPlayerStat('luck');
    if (!noneAreNaN([level, cha, per, lck])) {
      return NaN;
    }
    return followerIndex(level, cha, per, lck);
  };

  this.getFollower = function() {
    var fCha, fPer;
    fCha = getFollowerStat('charisma');
    fPer = getFollowerStat('perception');
    if (!noneAreNaN([fCha, fPer])) {
      return NaN;
    }
    return follower(fCha, fPer);
  };

  this.checkFollower = function() {
    var f, fInd, icon;
    updateCarryWeight(Type.FOLLOWER);
    icon = $('#follower_icon');
    fInd = getFollowerIndex();
    f = getFollower();
    if (!noneAreNaN([fInd, f])) {
      icon.removeClass("black red green");
      icon.addClass("black");
      return;
    }
    if (fInd > f) {
      icon.removeClass("black red green");
      return icon.addClass("green");
    } else {
      icon.removeClass("black red green");
      return icon.addClass("red");
    }
  };

  this.saveButton = function() {
    Cookies.set('saved_data', saveData());
    return cycleButton('save_button', 'Done');
  };

  this.cycleButton = function(id, tempText) {
    var content, normalText;
    content = $("#" + id + " > div");
    normalText = content.text();
    content.transition('scale', '150ms', function() {
      return content.text(tempText);
    });
    delay(150, function() {
      return content.transition('scale', '150ms');
    });
    delay(1650, function() {
      return content.transition('scale', '150ms', function() {
        return content.text(normalText);
      });
    });
    return delay(1800, function() {
      return content.transition('scale', '150ms');
    });
  };

  this.delay = function(timeout, callback) {
    return setTimeout(callback, timeout);
  };

  this.generateSPECIALObject = function(str, per, end, cha, inte, agl, lck, flwer) {
    var followerSpecial, special;
    if (flwer == null) {
      flwer = false;
    }
    special = {
      'strength': str,
      'perception': per,
      'endurance': end,
      'charisma': cha,
      'intelligence': inte,
      'agility': agl,
      'luck': lck
    };
    if (!flwer) {
      return special;
    }
    followerSpecial = {};
    $.each(special, function(name, value) {
      followerSpecial["follower_" + name] = value;
      return true;
    });
    return followerSpecial;
  };

  this.followers = {
    'arcade': generateSPECIALObject(6, 6, 4, 6, 10, 6, 4, true),
    'boone': generateSPECIALObject(7, 8, 5, 1, 3, 7, 6, true),
    'lily': generateSPECIALObject(9, 3, 8, 5, 3, 10, 6, true),
    'raul': generateSPECIALObject(6, 6, 4, 2, 7, 8, 5, true),
    'cass': generateSPECIALObject(7, 7, 4, 4, 4, 6, 4, true),
    'veronica': generateSPECIALObject(7, 5, 6, 3, 6, 7, 3, true),
    'ede': generateSPECIALObject(6, 10, 5, 5, 5, 7, 9, true),
    'none': generateSPECIALObject('', '', '', '', '', '', '', true)
  };

  this.orr = function(num, other) {
    if (other == null) {
      other = 0;
    }
    if (isNaN(num)) {
      return other;
    } else {
      return num;
    }
  };

  this.getPlayerStatZero = function(name) {
    return orr(getPlayerStat(name));
  };

  this.sumCoins = function() {
    var aurei, denarii, denariiMangled, sum;
    aurei = getPlayerStatZero('aurei');
    denarii = getPlayerStatZero('denarii');
    denariiMangled = getPlayerStatZero('denarii_mangled');
    sum = aurei + denarii + denariiMangled;
    $('#coins').val(sum === 0 ? '' : sum);
    return updateCarryWeight(Type.PLAYER);
  };

  this.sumBills = function() {
    var fives, hundreds, sum, twenties;
    hundreds = getPlayerStatZero('100_bills');
    twenties = getPlayerStatZero('20_bills');
    fives = getPlayerStatZero('5_bills');
    sum = hundreds + twenties + fives;
    $('#bills').val(sum === 0 ? '' : sum);
    return updateCarryWeight(Type.PLAYER);
  };

  this.setCurrencyAmountValue = function(obj) {
    var amt, currency, id, multiplier;
    obj = $(obj);
    id = obj.prop('id');
    currency = Currency.getByID(id);
    if (currency == null) {
      return;
    }
    multiplier = currency.value;
    amt = orr(parseInt(obj.val()));
    amt *= multiplier;
    amt = formatNumber(amt);
    return obj.siblings('.value').text(amt);
  };

  this.formatNumber = function(number) {
    var options;
    if (number === 0) {
      return 0;
    }
    options = new JsNumberFormatter.formatNumberOptions();
    return JsNumberFormatter.formatNumber(number, options, false);
  };

  this.numberFromFormat = function(format) {
    var options;
    options = new JsNumberFormatter.parseNumberSimpleOptions();
    return JsNumberFormatter.parseNumberSimple(format, options, false);
  };

  this.updateCurrencyAmountValues = function() {
    return $.each(Currency.values(), function(i, currency) {
      return setCurrencyAmountValue($("#" + currency.id));
    });
  };

  this.computeCurrencyWeight = function(type) {
    return getCapsWeight(type) + getBillsWeight(type) + getCoinsWeight(type);
  };

  this.getCurrencyWeight = function(type) {
    return computeCurrencyWeight(type).toFixed(2);
  };

  this.getBillsWeight = function(type) {
    var bills;
    bills = getStat(type, 'bills');
    if (isNaN(bills)) {
      return 0;
    } else {
      return bills / 500;
    }
  };

  this.getCoinsWeight = function(type) {
    var coins;
    coins = getStat(type, 'coins');
    if (isNaN(coins)) {
      return 0;
    } else {
      return coins * (13 / 1000);
    }
  };

  this.getCapsWeight = function(type) {
    var caps;
    caps = getStat(type, 'bottle_caps');
    if (isNaN(caps)) {
      return 0;
    } else {
      return caps / 200;
    }
  };

  this.getBobbyPinsWeight = function(type) {
    var pins;
    pins = getStat(type, 'bobby_pins');
    if (isNaN(pins)) {
      return 0;
    } else {
      return pins / 720;
    }
  };

  this.updateCarryWeight = function(type) {
    var armorWeight, end, level, maxCarryWeight, newText, oldText, str;
    end = getStat(type, 'endurance');
    str = getStat(type, 'strength');
    level = getStat(Type.PLAYER, 'level');
    armorWeight = getStat(type, 'armor_weight');
    if (isNaN(armorWeight)) {
      armorWeight = 0;
    }
    maxCarryWeight = $("#" + (type === Type.FOLLOWER ? 'follower_' : '') + "max_carry_weight");
    if (!noneAreNaN([end, str, level, armorWeight])) {
      maxCarryWeight.text('0');
      return;
    }
    oldText = maxCarryWeight.text();
    newText = Math.round((carryWeight(level, end, str, armorWeight) - getCurrencyWeight(type) - getBobbyPinsWeight(type)) * 100) / 100;
    maxCarryWeight.text(newText);
    if (Number(oldText) !== newText) {
      return maxCarryWeight.transition({
        'animation': 'pulse',
        'queue': false
      });
    }
  };

  this.saveData = function() {
    var data;
    saveRunner.cancel();
    saveRunner.run();
    data = {
      'fields': {}
    };
    $('input').each(function(i, input) {
      data.fields[input.id] = input.value;
      return true;
    });
    return data;
  };

  this.getTotalValue = function() {
    var value;
    value = 0;
    $.each(CurrencyType, function(name, content) {
      value += content.getValue();
      return true;
    });
    return value;
  };

  this.updateCurrencyLabel = function(currencyType) {
    var parent, shape, value, weight;
    parent = currencyType.getField();
    value = formatNumber(currencyType.getValue());
    shape = parent.parent().siblings('label').children('.shape');
    shape.find('.value').text(value + " " + (value === 1 ? 'cap' : 'caps'));
    weight = formatNumber(currencyType.getWeight());
    return shape.find('.weight').text(weight + " " + (weight === 1 ? 'lb' : 'lbs'));
  };

  this.updateCurrencyLabels = function() {
    var totalValue, totalWeight;
    updateCurrencyLabel(CurrencyType.BILLS);
    updateCurrencyLabel(CurrencyType.CAPS);
    updateCurrencyLabel(CurrencyType.COINS);
    totalValue = formatNumber(getTotalValue());
    $('#currency_total_caps').text(totalValue + " " + (totalValue === 1 ? 'cap' : 'caps'));
    totalWeight = formatNumber(computeCurrencyWeight(Type.PLAYER));
    return $('#currency_total_weight').text(totalWeight + " " + (totalWeight === 1 ? 'lb' : 'lbs'));
  };

  this.prepare = function() {
    sumCoins();
    sumBills();
    updateCurrencyAmountValues();
    updateCurrencyLabels();
    return processInformation();
  };

  this.loadData = function(data) {
    var fields, selectedFollower;
    if (data == null) {
      return;
    }
    saveRunner.cancel();
    fields = data.fields;
    $.each(fields, function(id, value) {
      if (!id) {
        return true;
      }
      $("input#" + id).val(value);
      return true;
    });
    if (fields.hasOwnProperty('selected_follower')) {
      selectedFollower = fields['selected_follower'];
      if (selectedFollower) {
        $('#follower_dropdown').dropdown('set selected', fields['selected_follower']);
        $('#follower_header').popup({
          'hoverable': true
        });
      }
    }
    if (fields.hasOwnProperty('internal_save_toggle') && fields['internal_save_toggle'] === 'on') {
      $('#save_toggle').checkbox('check');
    }
    if (fields.hasOwnProperty('payment_use_caps_first') && fields['payment_use_caps_first'] === 'on') {
      $('#payment_use_caps_first_parent').checkbox('check');
    }
    return prepare();
  };

  this.processInformation = function() {
    checkFollower();
    updateCarryWeight(Type.PLAYER);
    return updateCarryWeight(Type.FOLLOWER);
  };

  $(function() {
    $('input').on('input', function() {
      return processInformation();
    });
    $('#save_button').click(saveButton).popup({
      'hoverable': true
    });
    $('#load_button').click(function() {
      loadData(Cookies.getJSON('saved_data'));
      return cycleButton('load_button', 'Done');
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
    $('#save_toggle').checkbox({
      onChecked: function() {
        return saveRunner.run();
      },
      onUnchecked: function() {
        return saveRunner.cancel();
      }
    }).popup({
      content: 'Toggles autosave, which occurs every three minutes when enabled.'
    });
    $('#bills_input').popup({
      'hoverable': true
    });
    $('#coins_input').popup({
      'hoverable': true
    });
    $('#payment_use_caps_first_parent').checkbox({
      onChecked: PaymentCalculator.displayNormalCost,
      onUnchecked: PaymentCalculator.displayNormalCost
    });
    $('#currency_header').popup({
      'hoverable': true
    });
    $('#aurei, #denarii, #denarii_mangled').on('input', sumCoins);
    $('#100_bills, #20_bills, #5_bills').on('input', sumBills);
    $('#100_bills, #20_bills, #5_bills, #aurei, #denarii, #denarii_mangled').on('input', function() {
      return setCurrencyAmountValue(this);
    });
    $('#100_bills, #20_bills, #5_bills, #aurei, #denarii, #denarii_mangled, #bottle_caps').on('input', updateCurrencyLabels);
    $('#cost').on('input', PaymentCalculator.displayNormalCost);
    $('.ui.selection.dropdown').dropdown({
      action: 'activate',
      onChange: function(value) {
        if (!followers.hasOwnProperty(value)) {
          return;
        }
        $('#follower_header').popup({
          onVisible: function() {
            return $('#follower_dismiss_button').transition('flash');
          }
        }).popup('show');
        delay(1500, function() {
          return $('#follower_header').popup('hide').popup({
            'onVisible': void 0,
            'hoverable': true
          });
        });
        $('#follower_special').form('set values', followers[value]);
        return checkFollower();
      }
    });
    $('#follower_dismiss_button').click(function() {
      $('#follower_header').popup('destroy');
      $('#follower_dropdown').dropdown('clear');
      $('#follower_special').form('set values', followers['none']);
      return checkFollower();
    });
    $('.currency.text.shape').shape().click(function() {
      return $(this).shape('flip down');
    });
    $('#process_button').click(function() {
      var needed;
      needed = this.CurrencyMath.pay(getPlayerStatZero('cost', $('#payment_use_caps_first').prop('checked')));
      return $.each(needed, function(name, amount) {
        var amt;
        amt = getPlayerStatZero(name);
        $("#" + name).val(amt - amount);
        prepare();
        PaymentCalculator.displayNormalCost();
        return true;
      });
    });
    return prepare();
  });

}).call(this);

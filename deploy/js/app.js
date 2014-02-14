// Generated by CoffeeScript 1.6.3
var Application, Fader, Filter, Mixer8, Sampler,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Sampler = (function() {
  function Sampler(context) {
    this.context = context;
    this.memory = {
      files: [],
      buffers: [],
      sources: []
    };
  }

  Sampler.prototype.add = function(url) {
    this.memory.files.push(url);
    return null;
  };

  Sampler.prototype.load = function() {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.memory.files.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(this.loadBuffer(this.memory.files[i]));
    }
    return _results;
  };

  Sampler.prototype.loadBuffer = function(url) {
    var request,
      _this = this;
    request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      _this.context.decodeAudioData(request.response, function(buffer) {
        var progress, total;
        if (!buffer) {
          console.error('error decoding audio buffer for', url);
          return;
        }
        _this.memory.buffers[url] = buffer;
        progress = Object.keys(_this.memory.buffers).length;
        total = _this.memory.files.length;
        window.dispatchEvent(new CustomEvent('sampler-load-progress', {
          detail: {
            progress: progress,
            total: total
          }
        }));
        if (Object.keys(_this.memory.buffers).length === _this.memory.files.length) {
          window.dispatchEvent(new CustomEvent('sampler-load-complete'));
        }
        return null;
      }, function(error) {
        console.error('decode error', error);
      });
      return null;
    };
    request.send();
    return null;
  };

  return Sampler;

})();

Mixer8 = (function() {
  function Mixer8(context) {
    this.context = context;
    this.master = new Fader(this.context, this.context.destination);
    this.channels = [];
    this.channels[0] = new Fader(this.context, this.master.input);
    this.channels[1] = new Fader(this.context, this.master.input);
    this.channels[2] = new Fader(this.context, this.master.input);
    this.channels[3] = new Fader(this.context, this.master.input);
    this.channels[4] = new Fader(this.context, this.master.input);
    this.channels[5] = new Fader(this.context, this.master.input);
    this.channels[6] = new Fader(this.context, this.master.input);
    this.channels[7] = new Fader(this.context, this.master.input);
  }

  return Mixer8;

})();

Fader = (function() {
  function Fader(context, output) {
    this.context = context;
    this.volume = 1;
    this.input = this.context.createGain();
    this.output = output;
    this.input.connect(this.output);
  }

  Fader.prototype.changeVolume = function(value) {
    var fraction;
    fraction = value / 1;
    this.input.gain.value = fraction * fraction;
    return null;
  };

  return Fader;

})();

Filter = (function() {
  Filter.LOW_PASS = 0;

  Filter.HIGH_PASS = 1;

  Filter.BAND_PASS = 2;

  Filter.LOW_SHELF = 3;

  Filter.HIGH_SHELF = 4;

  Filter.PEAKING = 5;

  Filter.NOTCH = 6;

  Filter.ALL_PASS = 7;

  Filter.QUAL_MUL = 30;

  function Filter(context, type, input, output) {
    if (type == null) {
      type = Filter.LOW_PASS;
    }
    this.context = context;
    this.type = type;
    this.input = input;
    this.output = output;
    this.frequency = 0;
    this.Q = 0;
    this.filter = this.context.createBiquadFilter();
    this.filter.type = this.type;
    this.filter.frequency.value = 5000;
    this.input.connect(this.filter);
    this.filter.connect(this.output);
  }

  Filter.prototype.toggle = function(enable) {
    this.input.disconnect(0);
    this.filter.disconnect(0);
    if (enable) {
      this.input.connect(this.filter);
      this.filter.connect(this.output);
    } else {
      this.input.connect(this.output);
    }
    return null;
  };

  Filter.prototype.changeQuality = function(value) {
    this.Q = value * Filter.QUAL_MUL;
    this.filter.Q.value = this.Q;
    return null;
  };

  Filter.prototype.changeFrequency = function(value) {
    var maxValue, minValue, multiplier, numberOfOctaves;
    minValue = 40;
    maxValue = this.context.sampleRate / 2;
    numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
    multiplier = Math.pow(2, numberOfOctaves * (value - 1.0));
    this.frequency = maxValue * multiplier;
    this.filter.frequency.value = this.frequency;
    return null;
  };

  return Filter;

})();

Application = (function() {
  Application.prototype.log = 'please wait...';

  Application.prototype.sources = [];

  Application.prototype.isPlaying = false;

  function Application() {
    this.stopAll = __bind(this.stopAll, this);
    this.playAll = __bind(this.playAll, this);
    this.onSamplerLoadComplete = __bind(this.onSamplerLoadComplete, this);
    this.onSamplerLoadProgress = __bind(this.onSamplerLoadProgress, this);
    console.log('MPC v.0.0.1');
    this.context = new webkitAudioContext();
    this.mixer = new Mixer8(this.context);
    this.lowpass = new Filter(this.context, Filter.LOW_PASS, this.mixer.master.input, this.mixer.master.output);
    this.lowpass.toggle(true);
    this.sampler = new Sampler(this.context);
    this.sampler.add('mp3/Nude (Bass Stem).mp3');
    this.sampler.add('mp3/Nude (Drum Stem).mp3');
    this.sampler.add('mp3/Nude (Guitar Stem).mp3');
    this.sampler.add('mp3/Nude (String FX Stem).mp3');
    this.sampler.add('mp3/Nude (Voice Stem).mp3');
    window.addEventListener('sampler-load-progress', this.onSamplerLoadProgress, false);
    window.addEventListener('sampler-load-complete', this.onSamplerLoadComplete, false);
    this.init();
  }

  Application.prototype.init = function() {
    var test,
      _this = this;
    this.gui = new dat.GUI();
    this.gui.add(this, 'log').listen();
    this.folder_mixer = this.gui.addFolder('Mixer');
    this.folder_mixer.add(this.mixer.channels[0], 'volume', 0, 1).name('Bass').onChange(function(value) {
      return _this.mixer.channels[0].changeVolume(value);
    });
    this.folder_mixer.add(this.mixer.channels[1], 'volume', 0, 1).name('Drums').onChange(function(value) {
      return _this.mixer.channels[1].changeVolume(value);
    });
    this.folder_mixer.add(this.mixer.channels[2], 'volume', 0, 1).name('Guitar').onChange(function(value) {
      return _this.mixer.channels[2].changeVolume(value);
    });
    this.folder_mixer.add(this.mixer.channels[3], 'volume', 0, 1).name('Effects').onChange(function(value) {
      return _this.mixer.channels[3].changeVolume(value);
    });
    this.folder_mixer.add(this.mixer.channels[4], 'volume', 0, 1).name('Voice').onChange(function(value) {
      return _this.mixer.channels[4].changeVolume(value);
    });
    this.folder_master = this.folder_mixer.addFolder('Master');
    this.filter_folder = this.folder_master.addFolder('Filter');
    test = {
      q: 0,
      frequency: 1
    };
    this.filter_folder.add(test, 'q', 0, 1).onChange(function(value) {
      return _this.lowpass.changeQuality(value);
    });
    this.filter_folder.add(test, 'frequency', 0, 1).onChange(function(value) {
      return _this.lowpass.changeFrequency(value);
    });
    this.folder_master.add(this.mixer.master, 'volume', 0, 1).name('MASTER').onChange(function(value) {
      return _this.mixer.master.changeVolume(value);
    });
    this.gui.add(this, 'playAll').name('Play');
    this.gui.add(this, 'stopAll').name('Stop');
    return this.sampler.load();
  };

  Application.prototype.onSamplerLoadProgress = function(e) {
    this.log = 'Loading ' + e.detail.progress + '/' + e.detail.total;
    return null;
  };

  Application.prototype.onSamplerLoadComplete = function(e) {
    this.log = 'All samples Loaded';
    this.folder_mixer.open();
    this.folder_master.open();
    return null;
  };

  Application.prototype.playAll = function() {
    var i, input, instrument, _i, _ref;
    if (this.isPlaying === true) {
      return;
    }
    this.isPlaying = true;
    for (i = _i = 0, _ref = this.sampler.memory.files.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      instrument = this.sampler.memory.buffers[this.sampler.memory.files[i]];
      input = this.mixer.channels[i].input;
      this.playSound(instrument, input);
    }
    return null;
  };

  Application.prototype.stopAll = function() {
    var i, source, _i, _ref;
    if (this.isPlaying === false) {
      return;
    }
    this.isPlaying = false;
    for (i = _i = 0, _ref = this.sources.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      source = this.sources[i];
      if (!source.stop) {
        source.stop = source.noteOff;
      }
      source.stop(0);
    }
    this.sources = [];
    return null;
  };

  Application.prototype.playSound = function(buffer, input, time_, loop_) {
    var source;
    if (time_ == null) {
      time_ = 0;
    }
    if (loop_ == null) {
      loop_ = false;
    }
    source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(input);
    source.loop = loop_;
    if (!source.start) {
      source.start = source.noteOn;
    }
    source.start(time_);
    this.sources.push(source);
    return null;
  };

  return Application;

})();

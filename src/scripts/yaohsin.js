const axios = require('axios');
const moment = require('moment');
const path = process.env.VUE_APP_BACKEND_PATH || 'http://127.0.0.1:3030';
console.log(`path = ${path}`);
class Yaohsin {
  constructor() {
    this.ksmNominatorCache = [];
    this.dotNominatorCache = [];
  }

  async getOneKVOfficialNominators(coin) {
    let url = `${path}`;
    if(coin === 'DOT') {
      url += '/api/dot';
    } else {
      url += '/api';
    }
    const result = await axios.get(`${url}/1kv/nominators`);
    if(result.status === 200) {
      return result.data;
    } else {
      throw new Error('Failed to retrieve data: ' + result.status);
    }
  }

  async getAllNominators(options) {
    console.log(options);
    if(options === undefined) {
      options = {
        coin: 'KSM',
      };
    }
    let url = `${path}/api`;
    if(options.coin === 'DOT') {
      url += '/dot';
    }
    if(options.coin === 'KSM') {
      if(this.ksmNominatorCache.length > 0) {
        return this.ksmNominatorCache;
      }
    } else if(options.coin === 'DOT') {
      if(this.dotNominatorCache.length > 0) {
        return this.dotNominatorCache;
      }
    }
    const result = await axios.get(`${url}/nominators`);
    if(result.status === 200) {
      if(options.coin === 'KSM') {
        this.ksmNominatorCache = result.data;
      } else if(options.coin === 'DOT') {
        this.dotNominatorCache = result.data;
      }
      return result.data;
    } else {
      throw new Error('Failed to retrieve data: ' + result.status);
    }
  }

  async getNominatedValidators(stash, options) {
    console.log(options);
    if(options === undefined) {
      options = {
        coin: 'KSM',
      };
    }
    let url = `${path}/api`;
    if(options.coin === 'DOT') {
      url += '/dot';
    }
    return axios.get(`${url}/nominated/stash/${stash}`).then((result)=>{
      return result.data;
    }).catch(()=>{
      return [];
    });
  }

  async getOneKVList(params) {
    if(params === 'undefined') {
      params = {};
      params.rate = 100;
    }
    const result = await axios.get(`${path}/api/onekvlist?rate=${params.rate}`);
    if(result.status === 200) {
      return result.data;
    } else {
      throw new Error('Failed to retrieve data: ' + result.status);
    }
  }

  getRandomValidators(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  mergeOneKVList(onekv, detailInfo, oneKVNominators) {
    onekv.forEach(element => {
      const name = element.name;
      detailInfo.forEach(detail => {
        if(detail.stakingInfo !== undefined && detail.stakingInfo !== null) {
          if(detail.name === name) {
            if(detail.electedRate !== undefined) {
              element.electedRate = detail.electedRate;
            } else {
              element.electedRate = detail.inclusion;
            }
            if(detail.stakingInfo.stakingLedger !== undefined) {
              element.commission = detail.stakingInfo.validatorPrefs.commission;
              element.stakeSize = detail.stakingInfo.stakingLedger.total;
              element.totalNominators = detail.totalNominators;
              element.activeNominators = detail.activeNominators;
            }
            if(moment(element.nominatedAt).unix() === 0) {
              element.nominatedAt = '--';
            } else {
              element.nominatedAt = moment(element.nominatedAt).format('MM/DD');
            }
            
            element.oneKVNominated = false;
            // find matched 1kv nominator
            const validator = detail.stash;
            for(let j = 0; j < oneKVNominators.length; j++) {
              const oneKV = oneKVNominators[j];
              for(let k = 0; k < oneKV.current.length; k++) {
                if(oneKV.current[k].stash === validator) {
                  element.oneKVNominated = true;
                  element.oneKVStash = oneKV.address;
                  element.lastNomination = Date.parse(oneKV.lastNomination);
                  const nominatedForNumber = Date.now() - element.lastNomination;
                  element.nominatedFor = this.__parseTimeDiffrenceToString(nominatedForNumber);
                  break;
                }
              }
              if(element.oneKVNominated === true) {
                break;
              }
            }
          }
        }
      });
    });
    return onekv;
  }
  
  __parseTimeDiffrenceToString(timeDiff) {
    const timeDiffSeconds = timeDiff / 1000;
    const timeDiffHour = (timeDiffSeconds / 3600).toFixed(0);
    // const timeDiffMinutes = (timeDiffSeconds / 60).toFixed(0) % 60;
    return this.__pad(timeDiffHour, 2) + ' hours';
  }

  __pad (str, max) {
    str = str.toString();
    return str.length < max ? this.__pad("0" + str, max) : str;
  }

  async getOneKVInfo(coin) {
    let url = `${path}`;
    if(coin === 'DOT') {
      url += '/api/dot';
    } else {
      url += '/api';
    }
    const result = await axios.get(`${url}/valid`);
    if(result.status === 200) {
      result.data.valid.map((v)=>{
        if(v.electedRate === undefined) {
          v.electedRate = 0;
        }
      });
      return result.data;
    } else {
      throw new Error('Failed to retrieve data: ' + result.status);
    }
  }

  getOneKVDetailedInfo(coin, params) {
    let url = `${path}`;
    if(coin === 'DOT') {
      url += '/api/dot';
    } else {
      url += '/api';
    }
    if(params === undefined) {
      params = {
        ignoredValidators: [],
      };
    }
    return axios.get(`${url}/validDetail?option=1kv`).then((result)=>{
      if(result.status === 200) {
        if(params.electedRate > 0) {
          result.data.valid = result.data.valid.reduce((acc, v) => {
            if(v.electedRate < params.electedRate) {
              acc.push(v);
            }
            return acc;
          }, []);
        }
        if(params.totalNominators > 0) {
          result.data.valid = result.data.valid.reduce((acc, v) => {
            if(v.totalNominators < params.totalNominators) {
              acc.push(v);
            }
            return acc;
          }, []);
        }
        if(params.ignoredValidators.length > 0) {
          result.data.valid = result.data.valid.reduce((acc, v) => {
            if(v.stakingInfo !== undefined && v.stakingInfo !== null) {
              if(!params.ignoredValidators.includes(v.stakingInfo.accountId)) {
                acc.push(v);
              }
            }
            return acc;
          }, []);
        }
        result.data.valid = result.data.valid.reduce((acc, v) => {
          acc.push(v);
          return acc;
        }, []);
        return result.data;
      } else {
        throw new Error('Failed to retrieve data: ' + result.status);
      }
    });
  }

  async getValidatorUnclaimedEras(stash, options) {
    console.log(options);
    if(options === undefined) {
      options = {
        coin: 'KSM',
      };
    }
    if(options.coin === undefined) {
      options.coin = 'KSM';
    }
    let url = `${path}/api`;
    if(options.coin === 'DOT') {
      url += '/dot';
    }
    return axios.get(`${url}/validator/${stash}/unclaimedEras`).then((result)=>{
      return result.data;
    }).catch(()=>{
      return [];
    });
  }

  async getValidatorStatus(stash, options) {
    let url;
    ({ url, options } = this.fillUrlByCoinName(options));
    return axios.get(`${url}/validator/${stash}/trend`).then((result)=>{
      return result;
    });
  }

  async getValidatorStatusOfCurrentEra(stash, options) {
    let url;
    ({ url, options } = this.fillUrlByCoinName(options));
    return axios.get(`${url}/validator/${stash}`).then((result)=>{
      return result;
    });
  }

  fillUrlByCoinName(options) {
    console.log(options);
    if (options === undefined) {
      options = {
        coin: 'KSM',
      };
    }
    if (options.coin === undefined) {
      options.coin = 'KSM';
    }
    let url = `${path}/api`;
    if (options.coin === 'DOT') {
      url += '/dot';
    }
    return { url, options };
  }

  async getAllValidatorAndNominators(options) {
    let url;
    ({ url, options } = this.fillUrlByCoinName(options));
    return axios.get(`${url}/allValidators?size=1500`).then((result)=>{
      return result.data;
    });
  }

  async getNominatorBalances(nominators) {
    const clone = [...nominators];
    let arrays = [clone];
    if(clone.length > 30) {
      arrays = this.__splitNominatorArray(clone);
    }
    let results = [];
    for(let i = 0; i < arrays.length; i++) {
      const data = JSON.stringify(arrays[i]);
      const tmp = await axios.get(`${path}/api/nominators/${data}/stakingInfo`).then((result)=>{
        return result.data;
      });
      results = results.concat(tmp);
    }
    return results;
  }

  async getStashRewards(id, options) {
    let url;
    ({ url, options } = this.fillUrlByCoinName(options));
    const result = await axios.get(`${url}/stash/${id}/rewards`).then((result)=>{
      return result.data;
    }).catch(()=>{
      return undefined;
    });
    return result;
  }

  __splitNominatorArray(array) {
    let result = [];
    const parts = 4;
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
  }
}

module.exports = Yaohsin;

// Demo dataset (snadno vyměníme za API fetch)
// Tip: v ostré verzi sem jen přepneme zdroj dat.
export const baseRows = [
  {type:'stock',symbol:'AAPL',name:'Apple Inc.',price:219.85,d1:1.26,w1:2.10,signals:['breakout','vol'],forecast:{min:165,avg:245,max:310,conf:72}},
  {type:'crypto',symbol:'BTCUSD',name:'Bitcoin',price:67200,d1:2.30,w1:6.80,signals:['breakout','vol'],forecast:{min:42000,avg:88000,max:120000,conf:58}},
  {type:'stock',symbol:'NVDA',name:'NVIDIA Corporation',price:241.80,d1:1.85,w1:4.10,signals:['earn','vol'],forecast:{min:128,avg:281,max:498,conf:72}}
];

export const extraRows = [
  {type:'stock',symbol:'MSFT',name:'Microsoft Corp.',price:432.2,d1:0.8,w1:2.5,signals:['mean'],forecast:{min:360,avg:480,max:560,conf:69}},
  {type:'stock',symbol:'AMZN',name:'Amazon.com, Inc.',price:176.8,d1:1.1,w1:3.2,signals:['breakout'],forecast:{min:140,avg:210,max:260,conf:65}},
  {type:'stock',symbol:'GOOGL',name:'Alphabet Inc. (Class A)',price:162.4,d1:-0.3,w1:1.7,signals:['mean'],forecast:{min:130,avg:190,max:240,conf:63}},
  {type:'stock',symbol:'META',name:'Meta Platforms, Inc.',price:506.5,d1:1.9,w1:5.1,signals:['vol'],forecast:{min:380,avg:560,max:720,conf:66}},
  {type:'stock',symbol:'TSLA',name:'Tesla, Inc.',price:214.3,d1:-1.2,w1:4.4,signals:['mean','vol'],forecast:{min:150,avg:260,max:340,conf:55}},
  {type:'index',symbol:'SPX',name:'S&P 500 Index',price:5518,d1:0.30,w1:1.2,signals:['breakout'],forecast:{min:5100,avg:5800,max:6300,conf:59}},
  {type:'index',symbol:'NDX',name:'NASDAQ 100',price:19980,d1:0.45,w1:1.6,signals:['breakout','vol'],forecast:{min:17500,avg:21000,max:23500,conf:60}},
  {type:'forex',symbol:'EURUSD',name:'Euro / US Dollar',price:1.086,d1:-0.12,w1:0.30,signals:['mean'],forecast:{min:1.04,avg:1.10,max:1.14,conf:52}},
  {type:'forex',symbol:'USDJPY',name:'US Dollar / Japanese Yen',price:152.2,d1:0.05,w1:-0.20,signals:['mean'],forecast:{min:146,avg:151,max:157,conf:50}},
  {type:'crypto',symbol:'ETHUSD',name:'Ethereum',price:3360,d1:1.9,w1:7.2,signals:['breakout','vol'],forecast:{min:2200,avg:4200,max:5600,conf:56}},
  {type:'commodity',symbol:'XAUUSD',name:'Gold (Spot)',price:2368,d1:-0.2,w1:0.5,signals:['mean'],forecast:{min:2100,avg:2400,max:2650,conf:58}},
  {type:'commodity',symbol:'WTI',name:'Crude Oil WTI',price:81.4,d1:0.6,w1:1.8,signals:['vol'],forecast:{min:70,avg:86,max:98,conf:55}}
];

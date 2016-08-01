'use strict';

let _ = require('lodash');
let {loadAllItems, loadPromotions} = require('../spec/fixtures');

function printReceipt(tags) {
  let formattedTags = formatTags(tags);
  let countedBarcodes = countBarcodes(formattedTags);
  let allItems = loadAllItems();
  let cartItems = buildCartItems(countedBarcodes, allItems);
  let promotions = loadPromotions();
  let promotedItems = buildPromotions(cartItems, promotions);
  let totalPrices = calculateTotalPrices(promotedItems);
  let receipt = buildReceipt(promotedItems, totalPrices);
  let receiptString = buildReceiptString(receipt);
  console.log(receiptString);
}

function formatTags(tags) {
  return _.map(tags, tag => {
    if (tag.includes('-')) {
      let [barcode,count] = tag.split('-');
      return {barcode, count: parseFloat(count)};
    } else {
      return {barcode: tag, count: 1};
    }
  })
}

function _getExistElementByBarcodes(array, barcode) {
  return _.find(array, item => item.barcode === barcode);
}

function countBarcodes(formattedTags) {
  return _.reduce(formattedTags, (result, formattedTag)=> {
    let found = _getExistElementByBarcodes(result, formattedTag.barcode);
    if (found) {
      found.count += formattedTag.count;
    } else {
      result.push({barcode: formattedTag.barcode, count: formattedTag.count});
    }
    return result;
  }, [])

}

function buildCartItems(countedBarcodes, allItems) {
  return _.map(countedBarcodes, ({barcode, count})=> {
    let {name, unit, price} = _getExistElementByBarcodes(allItems, barcode);
    return {barcode, name, unit, price, count};
  })
}

function buildPromotions(cartItems, promotions) {
  let currentPromotion = promotions.find((promotion) => promotion.type === 'BUY_TWO_GET_ONE_FREE');
  return cartItems.map(({price, count, barcode, name, unit})=> {
    let hasPromoted = currentPromotion.barcodes.find(b => b === barcode);
    let saved = hasPromoted ? price * Math.floor(count / 3) : 0;
    let payPrice = price * count - saved;
    return {barcode, name, unit, price, count, payPrice, saved};
  })
}

function calculateTotalPrices(promotedItems) {
  return {
    totalPayPrice: _.sumBy(promotedItems, promotedItem => promotedItem.payPrice),
    totalSaved: _.sumBy(promotedItems, promotedItem => promotedItem.saved)
  };
}

function buildReceipt(promotedItems, {totalPayPrice, totalSaved}) {
  return {
    receiptItems: promotedItems.map(({name, unit, price, count, payPrice, saved})=> {
      return {name, unit, price, count, payPrice, saved};
    }),
    totalPayPrice,
    totalSaved
  }
}
// ***<没钱赚商店>收据***
//   名称：雪碧，数量：5瓶，单价：3.00(元)，小计：12.00(元)
//   名称：荔枝，数量：2.5斤，单价：15.00(元)，小计：37.50(元)
//   名称：方便面，数量：3袋，单价：4.50(元)，小计：9.00(元)
//   ----------------------
//   总计：58.50(元)
//   节省：7.50(元)
//   **********************
function buildReceiptString(receipt) {
  let lines = [];
  lines.push('***<没钱赚商店>收据***');
  receipt.receiptItems.map(item =>{
    lines.push(`名称：${item.name}，数量：${item.count}${item.unit}，单价：${parseFloat(item.price).toFixed(2)}(元)，小计：${parseFloat(item.payPrice).toFixed(2)}(元)`);
  });
  lines.push('----------------------');
  lines.push(`总计：${parseFloat(receipt.totalPayPrice).toFixed(2)}(元)`);
  lines.push(`节省：${parseFloat(receipt.totalSaved).toFixed(2)}(元)`);
  lines.push('**********************');

  return lines.join('\n');
}

function printReceipt(tags) {
  let formattedTags = formatTags(tags);
  let countedBarcode = countBarcodes(formattedTags);
  let buildedCartItems = buildCartItems(countedBarcode, loadAllItems());
  let buildedPromotionos = buildPromotions(buildedCartItems, loadPromotions());
  let calculatedTotalPrices = calculateTotalPrices(buildedPromotionos);
  let buildedReceipt = buildReceipt(buildedPromotionos, calculatedTotalPrices);
  let receiptString = buildReceiptString(buildedReceipt);
  
  require('fs').writeFileSync('1', receiptString);

  console.log(receiptString);
}

module.exports = {
  formatTags,
  countBarcodes,
  buildCartItems,
  buildPromotions,
  calculateTotalPrices,
  buildReceipt,
  buildReceiptString,
  printReceipt
};

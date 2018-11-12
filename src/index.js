var $ = require("jquery");
var _ = require("underscore");
var Bind = require("bind.js");

// var prDetails = [];
window.PRDetails = {};
window.PRNodes = [];
window.CDetails = {};
window.mObjects = {};
window.Exceptions = [
  "PONum",
  "Subject",
  "PRDetailID",
  "QDetailID",
  "PRID",
  "PurchaseEmpNum",
  "InvoiceEmpNum",
  "InvoiceEmpName",
  "PRDeliveryID"
];
window._ = _;

//toggleText extend
$.fn.extend({
  toggleText: function(a, b) {
    return this.text(this.text() == b ? a : b);
  }
});

//querySelect取得第一個符合的node
var Expand1 = document.querySelector(".ExpandAllDetail");
Expand1.addEventListener("click", function() {
  var icons = this.querySelectorAll("i.fa-angle-double-down");
  for (var value of icons.values()) {
    console.log(`value:${value.outerHTML}`);
  }
});

//定義node和object綁定
var defineReactive = function(obj, key, node) {
  Object.defineProperty(obj, key, {
    get: function() {
      if (node.tagName === "INPUT" || node.tagName === "SELECT") {
        return $("#" + node.attributes["name"].value).val();
      } else {
        return node.textContent;
      }
    },
    set: function(newVal) {
      if (node.tagName === "INPUT" || node.tagName === "SELECT") {
        $("#" + node.attributes["name"].value).val(newVal);
      } else {
        node.textContent = newVal;
      }
    }
  });
};

function getAllNode(id) {
  var rootnode = document.getElementById(id);
  var walker = document.createTreeWalker(
    rootnode,
    NodeFilter.SHOW_ALL,
    null,
    false
  );
  //取得TextNode
  while (walker.nextNode()) {
    var node = walker.currentNode;
    if (node.nodeName === "#text") {
      //text element
      console.log(`節點名稱:${node.nodeName}`);
      console.log(`textNode nodeValue:${name}`);
      // defineReactive(PRNodes, name, node);
    } else {
      var attrs = node.attributes;
      for (var i = attrs.length - 1; i >= 0; i--) {
        console.log(`屬性名稱:${attrs[i].name} -> ${attrs[i].value}`);
        if (attrs[i].name === "name") {
          PRNodes.push({ name: attrs[i].value, node: node });
          // defineReactive(PRNodes, attrs[i].value, node);
        }
      }
    }
  }
}

//遍歷巢狀物件陣列
function eachRecursive(obj) {
  for (var k in obj) {
    if (typeof obj[k] == "object" && obj[k] !== null) {
      eachRecursive(obj[k]);
    } else {
      // do something...
      console.log(`key:${k} value:${obj[k]}`);
      // Object.defineProperty(CDetails, k, {
      //   get: function() {
      //     console.log(`key:${k}  value:${CDetails[k]}`);
      //     // return obj[k];
      //   },
      //   set: function(value) {
      //     CDetails[k] = value;
      //   }
      // });
    }
  }
}

//綁定版型與資料內容
var BindTemplate = function(template, data) {
  //$.ajax("template.html"), $.getJSON("src/data.json") 取得版型和取得資料，每個回傳結果如下
  //data, statusText, jqXHR
  var prTemplate = $("#prDetail", $(template)).html(); //取得版型
  // //版型綁定資料
  // $.getJSON("src/data.json", function(data) {
  var poTemplate = _.template(prTemplate);
  $("table").append(poTemplate(data));
  // eachRecursive(data);
};

function DefineObj(detail, k, value) {
  var _value = value;
  Object.defineProperty(detail, k, {
    get: function() {
      return this._value;
    },
    set: function(newValue) {
      this._value = newValue;
    }
  });
}

//look through object 裏有array
function checkArrayOrNativeValue(data, detail) {
  for (var k in data) {
    if (typeof data[k] == "object" && data[k] !== null) {
      if (Array.isArray(data[k])) {
        console.log(`${k} is array`);
        detail[k] = [];
        for (var i = 0; i < data[k].length; i++) {
          detail[k][i] = {};
          checkArrayOrNativeValue(data[k][i], detail[k][i]);
        }
      }
    } else {
      detail[k] = data[k];
      // Object.defineProperty(detail, k, {
      //   value: data[k],
      //   writeable: true,
      //   configable: true
      // });
      Object.defineProperty(detail, k, {
        // get: function() {
        //   return data[k];
        // },
        set: function(newValue) {
          console.log(`want to find ${Object.keys(this)}`);
          console.log(newValue);
        }
      });
      // Object.defineProperty(detail, k, {
      //   get: function() {
      //     return detail[k];
      //   },
      //   set: function(newValue) {
      //     detail[k] = newValue;
      //   }
      // });
    }
  }
}

//對應到Dom相關的Element
function mapElement(data, idName) {
  for (var k in data) {
    if (typeof data[k] == "object" && data[k] !== null) {
      console.log(`${k} is array`);
      idName += `${k}`;
      for (var i = 0; i < data[k].length; i++) {
        var name = `${idName}[${i}].`;
        mapElement(data[k][i], name);
      }
    } else {
      console.log(`${idName}${k}`);
      console.log(`dom:td[name=${idName}${k}]`);
      var name = `${idName}${k}`.replace(/\[/g, ".").replace(/\]/g, "");
      var exceptionRes = name.split(".");
      if (exceptionRes.length > 0) {
        console.log(exceptionRes[exceptionRes.length - 1]);
        if (Exceptions.indexOf(exceptionRes[exceptionRes.length - 1]) === -1) {
          if (exceptionRes[exceptionRes.length - 1] === "ChargeDept") {
            mObjects[name] = `[id="${idName}${k}"]`;
          } else {
            mObjects[name] = `[name="${idName}${k}"]`;
          }
        }
      } else {
        mObjects[name] = `[name="${idName}${k}"]`;
      }
    }
    // console.log(`${idName}["${k}"] - ${data[k]}`);
  }
}

$(function() {
  //產生明細內容
  $.when($.ajax("template.html"), $.getJSON("src/data.json")).done(function(
    template,
    data
  ) {
    // BindTemplate(template[0], data[0].PRDetails);
    //$.ajax("template.html"), $.getJSON("src/data.json") 取得版型和取得資料，每個回傳結果如下
    //data, statusText, jqXHR
    var prTemplate = $("#prDetail", $(template[0])).html(); //取得版型
    // //版型綁定資料
    // $.getJSON("src/data.json", function(data) {
    var poTemplate = _.template(prTemplate);
    $("table").append(poTemplate(data[0]));
    // var test = { test: "Hello World" };
    // var testTemplate = $("#another", $(template[0])).html(); //取得版型
    // var result = _.template(testTemplate);
    // $("table").append(result(test));

    PRDetails = data[0];

    mapElement(PRDetails, "");
    // 測試bind
    CDetails = Bind(PRDetails, mObjects);
    // CDetails = Bind(PRDetails, {
    //   "PRDetails.0.CategoryName": "td[name='PRDetails[0].CategoryName'",
    //   "PRDetails.1.CategoryName": "td[name='PRDetails[1].CategoryName'"
    // });

    // var detail = PRDetails.PRDetails[0];
    // Object.defineProperty(CDetails, 'PRDetails[0]["CategoryName"]', {
    //   get: function() {
    //     // console.log(`value:${detail["CategoryName"]}`);
    //     return "Hello";
    //   }
    // set: function(value) {
    //   PRDetails.PRDetails[0]["CategoryName"] = value;
    // }
  });

  // eachRecursive(PRDetails);

  //取得所有HTML Node
  // getAllNode("app");
  // var anotherTemplate = $("#another", $(template[0])).html(); //取得版型

  // var genHello = _.template(anotherTemplate);
  // var test = "Hello World";
  // $("#app").append(genHello(test));
});

//展開明細
$(document).on("click", ".ExpandDetail", function() {
  var trChevron = $(this)
    .parents("tr")
    .siblings();
  if ($(this).find("i.fa-angle-down").length > 0) {
    trChevron.show(200);
    trChevron
      .find(".ExpandInnerDetail")
      .parents("tr")
      .nextAll()
      .show();
    trChevron
      .find(".ExpandInnerDetail")
      .parents("tr")
      .next()
      .hide();
    trChevron.find("span").text("收合");
  } else if ($(this).find("i.fa-angle-up").length > 0) {
    trChevron.hide(200);
    $(this)
      .find("span")
      .text("展開");
  }
  $(this)
    .find(".toggleArrow")
    .toggleClass("fa-angle-up fa-angle-down");
});
//展開送貨層
$(document).on("click", ".ExpandInnerDetail", function() {
  if (
    $(this)
      .find("span")
      .text() === "展開"
  ) {
    $(this)
      .parents("tr")
      .nextAll()
      .show();
    $(this)
      .parents("tr")
      .next()
      .hide();
  } else if (
    $(this)
      .find("span")
      .text() === "收合"
  ) {
    $(this)
      .parents("tr")
      .nextAll()
      .hide();
    $(this)
      .parents("tr")
      .next()
      .show();
  }
  $(this)
    .find("span")
    .toggleText("展開", "收合");
});
//展開所有明細層
$(".ExpandAllDetail").click(function() {
  if ($(this).find("i.fa-angle-double-down").length > 0) {
    $(this)
      .parents("table")
      .find("tbody .ExpandDetail")
      .each(function(index, element) {
        if ($(element).find("i.fa-angle-down").length > 0) {
          $(element).trigger("click");
        }
      });
    $(this)
      .parents("table")
      .find("tbody .ExpandInnerDetail")
      .each(function(index, element) {
        if (
          $(element)
            .find("span")
            .text() === "展開"
        ) {
          $(element).trigger("click");
        }
      });
  } else if ($(this).find("i.fa-angle-double-up").length > 0) {
    $(this)
      .parents("table")
      .find("tbody .ExpandDetail")
      .each(function(index, element) {
        if ($(element).find("i.fa-angle-up").length > 0) {
          $(element).trigger("click");
        }
      });
  }
  $(this)
    .find(".toggleArrow")
    .toggleClass("fa-angle-double-down fa-angle-double-up");
});

var snpData; 
var drugInfo;

var riskSummaryIds = {
  "Type 1 Diabetes": "DM1Risk",
  "Type 2 Diabetes": "DM2Risk",
  "Hypertension": "HYPRisk",
  "Coronary Heart Disease": "CHDRisk"
}

var riskListIds = {
  "Type 1 Diabetes": "DM1Span",
  "Type 2 Diabetes": "DM2Span",
  "Hypertension": "HYPSpan",
  "Coronary Heart Disease": "CHDSpan"
}

var riskRadarIds = {
  "Type 1 Diabetes": "radar_graph1",
  "Type 2 Diabetes": "radar_graph2",
  "Hypertension": "radar_graph3",
  "Coronary Heart Disease": "radar_graph4"
}

var acronyms = {
  "DM1": "Type 1 Diabetes",
  "DM2": "Type 2 Diabetes",
  "HYP": "Hypertension",
  "CHD": "Coronary Heart Disease"
}

var diseaseColors = {
  "Type 1 Diabetes": '#89A54E',
  "Type 2 Diabetes": '#AA4643',
  "Hypertension": '#89A54E',
  "Coronary Heart Disease": '#80699B' 
}

var renderRadarGraph = function(snpsByDisease, disease, renderTo) { 
  var snps = snpsByDisease[disease];
  var renderTo = riskRadarIds[disease];
  var opt = { 
    chart: {
      renderTo: renderTo,
      polar: 1
    }, 
    colors: [diseaseColors[disease]],
    title: {
      text: disease,
      margin: 0,
      y: 5
    }, 
    pane: {
      size: '98%',
      startAngle: 0,
      endAngle: 360
    }, 
    xAxis: {
      tickInterval: 360/snps.length,
      min: 0,
      max: Math.round(360/snps.length) * snps.length,
      labels: { enabled: false },
    }, 
    yAxis: {
      min: 0.5,
      max: 1.5,
      tickInterval: 0.5,
      labels: { enabled: false }
    }, 
    legend: {
      enabled: false
    }, 
    exporting: {
      enabled: false
    },
    credits: {
      enabled: false
    }, 
    tooltip: {
      bordercolor: '#4572A7',
      formatter: function() {
        return "<b>SNP: </b>"+
          snps[Math.round(this.x * snps.length / 360)].SNP+
          "<br.><b>Relative Risk: </b>"+
          snps[Math.round(this.x * snps.length / 360)].Risk;
      },
      style: {
        fontSize: '8pt'		
      }
    }, 
    plotOptions: {
      series: {
        pointStart: 0,
        pointInterval: 360 / snps.length
      },
      column: {
        pointRange: 0,
        stacking: 'normal',
        pointPadding: 0,
        groupPadding: 0
      }
    }, 
    series: [{
      type: 'area',
      data: _(snps).map(function(snp) { return Number.parseFloat(snp.Risk); })
    }]
  };
  return new Highcharts.Chart(opt);
};

var renderColumnGraph = function(risks, topSNPs, renderTo) {
  /*
   * render summary column graph
   */ 
  var categories = Object.keys(acronyms);
  var riskArr = _(categories).map(function(disease) {
    return risks[acronyms[disease]];
  });
  var opt = {
    chart: {
      renderTo: renderTo,
      type: 'column'
    },
    legend: {
      enabled: false
    },
    colors: ['#AA4643','#89A54E','#4572A7'],
    exporting: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: categories 
    },
    yAxis: {
      labels: {
        enabled: false
      },
      title: {
        text: ''
      }
    },
    tooltip: {
      bordercolor: '#4572A7',
      formatter: function() {
        var index = 0;
        var disease = acronyms[this.x];
        return '<b>'+disease+'</b><br/>'+'Relative Risk: '+risks[disease].toFixed(2)+'<br/>'+'Highest Risk SNP: '+topSNPs[disease].rsid;
      },
      style: {
        fontSize: '8pt'		
      }
    },
    plotOptions: {
      column: {
        animation: false,
      },
      series: {
        stacking: 'normal',
        shadow: false
      }
    },
    series: [{
      name: 'Above',
      data: _(riskArr).map(function(r) { return r > 1 ? r : 0; })
    },{
      name: 'Below',
      data: _(riskArr).map(function(r) { return r > 1 ? 0 : r; })
    }]
  };

  return new Highcharts.Chart(opt);
}

var loadSnpData = function() {
  return $.Deferred(function(dfd) { 
    $.getJSON('/snp-data', function(sd) {
      snpData = sd;
      dfd.resolve();
    });
  }).promise();
}; 

var loadDrugInfo = function() {
  return $.Deferred(function(dfd) { 
    $.getJSON('/drug-info', function(info) {
      drugInfo = info;
      dfd.resolve();
    });
  }).promise();
}

var loadGenomicData = function() {
  return $.Deferred(function(dfd) { 
    $.getJSON('/snps/'+genomic_pid, function(snps) {
      pt.snps = snps;
      dfd.resolve();
    });
  }).promise();
}; 

var matches = function(a, b) {
  /*
   * a and b are array of genotypes (e.g. ['A', 'A'])
   * matches two genotypes 
   */
  if (a === undefined || b === undefined) {
    return false;
  }
  a.sort();
  b.sort(); 
  return _.isEqual(a, b);
};

var getColor = function(risk) {
  if(risk <= 0.75) {
    return "green";
  } else if(risk >= 1.25 && risk < 2.00) {
    return "orange";
  } else if(risk >= 2.00) {
    return "red";
  } else {
    return "black";
  }
};

var createDrugAdvicHtml = function(advice) {
  return "<div>"+
    "<div style='width: 15%; float: left; text align: left; margin-left: 1px;'>"+advice.SNP+"</div>"+
    "<div style='width: 68%; float: right; text align: left; margin-left: 2px;'>"+advice.Effect+"</div>"+
    "<div style='width: 15%; float: right; text align: left; margin-left: 2px';>"+advice.Genotype+"</div>"+
    "<div class='clear'></div>"+
    "</div>"
}

var createSnpHtml = function(snp, isGray) {
  var colorClass = isGray ? 'class="gray"': "";
  return "<div "+colorClass+">"+
    "<div style='width: 26%; float: left; text align: left; margin-left: 2px'>"+snp.SNP+"</div>"+
    "<div style='width: 20%; float: left; text align: left; margin-left: -2px'>"+snp.Locus+"</div>"+
    "<div style='width: 13%; float: left; text align: left;'>"+snp.Chromosome+"</div>"+
    "<div style='width: 11%; float: left; text align: left;'>"+snp.Code+"</div>"+
    "<div style='width: 13%; float: left; text align: left;'>"+snp.Risk+"</div>"+
    "<div style='width: 15%; float: right; text-align: right; margin-right: 5px'>"+snp.Frequency+"</div>"+
    "<div class='clear'></div>"+
    "</div>"; 
};

var createRiskHtml = function(risk) {
  var color = getColor(risk);
  return "<font color='"+color+"'>"+risk.toFixed(2)+"</font>";
};

var processGenomicData = function() {
  var risks = {};
  var snps = {};
  var topSNPs = {};
  var drugAdvice = [];

  // initialize with default value
  for (var disease in riskSummaryIds) {
    risks[disease] = 1;
    snps[disease] = [];
    topSNPs[disease] = {
      risk: 0,
      rsid: 'N/A'
    };
  }
  // find genotype that matches our data 
  for (var rsid in snpData) {
    var snp = pt.snps[rsid];
    var variant = snpData[rsid];
    if (matches(snp, variant.Code.split(''))) {
      var risk = Number.parseFloat(variant.Risk);
      risks[variant.disease] *= risk; 
      snps[variant.disease].push(variant);
      var topSNP = topSNPs[variant.disease];
      if (topSNP.risk < risk) {
        topSNP.rsid = rsid;
        topSNP.risk = risk;
      }
    }
    var di = drugInfo[rsid];
    if (di !== undefined &&
        matches(snp, di.Genotype.split(''))) {
          drugAdvice.push(di);
        }
  }
  renderColumnGraph(risks, topSNPs, 'genomics_graph');
  for (var disease in risks) { 
    var totalRisk = createRiskHtml(risks[disease]);
    $('#'+riskSummaryIds[disease]).html(totalRisk);
    var diseaseSpan = $('#'+riskListIds[disease]);
    var isGray = false;
    _(snps[disease]).each(function(snp) {
      var visual = createSnpHtml(snp, isGray);
      isGray = !isGray;
      diseaseSpan.append(visual); 
    });
    diseaseSpan.append("<div style='float: right; text-align: right; margin-right: 10px;'><b> Total Relative Risk: "+totalRisk+"</b></div>");
    renderRadarGraph(snps, disease);
  } 
  // add drug advice
  var drugAdviceDisplay = _(drugAdvice).map(createDrugAdvicHtml).join('') || 'No information available';
  $('#drug_advice_list').html(drugAdviceDisplay);
}; 

$(document).ready(function() {
  $.when(
    loadSnpData()
    , loadGenomicData()
    , loadDrugInfo()).then(processGenomicData);
});

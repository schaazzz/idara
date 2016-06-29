import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import {History} from '../api/history';
import './project-stats.html';

const lineChartOptions = {
    fill: false,
    lineTension: 0.1,
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0.0,
    borderJoinStyle: 'miter',
    pointBackgroundColor: "#fff",
    pointBorderWidth: 1,
    pointHoverRadius: 5,
    pointHoverBorderColor: "rgba(220,220,220,1)",
    pointHoverBorderWidth: 2,
    pointRadius: 1,
    pointHitRadius: 10,
};

let stateDataset;
let trackerDataset;
let priorityDataset;
let severityDataset;

Template.projectStats.onCreated(function onCreated() {
    stateDataset = {labels: [], datasets: []};
    trackerDataset = {labels: [], datasets: []};
    priorityDataset = {labels: [], datasets: []};
    severityDataset = {labels: [], datasets: []};
});

function convertRgb2Rgba(color, alpha) {
    let r = color[1] + color[2];
    let g = color[3] + color[4];
    let b = color[5] + color[6];

    r = parseInt('0x' + r).toString();
    g = parseInt('0x' + g).toString();
    b = parseInt('0x' + b).toString();

    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

Template.projectStats.onRendered(function onRendered() {
    const colors = [
        '#4682B4', '#FF6347', '#FFDAB9', '#FFA500', '#32CD32',
        '#800080', '#808080', '#F0E68C', '#CD5C5C', '#E0FFFF',
        '#008000', '#0000FF', '#800000', '#808000', '#C71585',
        '#CD853F', '#FF4500', '#FFFF00', '#FF69B4', '#DDA0DD',
    ];

    let issueData = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: []
        }]
    };

    let count = 0;
    let totalCount = {};
    let workflow = Projects.findOne({'name': activeProject.get()}).workflow;
    for (let i = 0; i < workflow.length - 1; i++) {
        issueData.labels.push(workflow[i].stateName);

        let issues = Issues.find({'project': activeProject.get(), 'state': workflow[i].stateName});

        if (issues) {
            count = issues.count();
        }

        totalCount[workflow[i].stateName] = {count: count, visible: true};

        issueData.datasets[0].data.push(count);
        issueData.datasets[0].backgroundColor.push(colors[i]);
        issueData.datasets[0].hoverBackgroundColor.push(colors[i]);
    }

    let doughnutChartBase = Chart.controllers.doughnut.prototype.draw;
    Chart.helpers.extend(Chart.controllers.doughnut.prototype, {
        showTooltip: function() {
            let chart = this.chart;
            let ctx = chart.chart.ctx;
            ctx.save();
            doughnutChartBase.showTooltip.apply(this, arguments);
            ctx.restore();
        },
        draw: function() {
            doughnutChartBase.apply(this, arguments);
            let chart = this.chart;
            let ctx = chart.chart.ctx;

            let width = chart.chart.width;
            let height = chart.chart.height;

            let fontSize = (height / 100).toFixed(2);

    		ctx.fillStyle = 'Black';
            ctx.font = fontSize + "em Verdana";
            ctx.textBaseline = "middle";

            let count = 0;
            Object.keys(totalCount).forEach(function (key) {
                if (totalCount[key].visible) {
                    count += totalCount[key].count;
                }
            });
            let text = count;
            let textX = Math.round((width - ctx.measureText(text).width) / 2);
            let textY = height / 2.25;

            ctx.fillText(text, textX, textY);
        }
    });

    let ctxOpenIssues = document.getElementById("canvas-open-issues").getContext("2d");
    ctxOpenIssues.height = 200;

    let openIssuesDoughnutChart = new Chart(ctxOpenIssues, {
        type: 'doughnut',
        data: issueData,
        options: {
            legend: {
                onClick: function (event, legendItem) {
                    var index = legendItem.index;
    				var chart = this.chart;
    				var i, ilen, meta;
    				for (i = 0, ilen = (chart.data.datasets || []).length; i < ilen; ++i) {
    					meta = chart.getDatasetMeta(i);
    					meta.data[index].hidden = !meta.data[index].hidden;
    				}

    				chart.update();
                    totalCount[legendItem.text].visible = legendItem.hidden;
                },
                fullWidth: true,
                position: 'bottom',
                labels: {
                    boxWidth: 13,
                    fontSize: 13,
                    padding: 7,
                }
            }
        }
    });

    let history = History.findOne({'project': activeProject.get()});
    Object.keys(history.data).forEach(function (entry, uberIndex) {
        Object.keys(history.data[entry]).forEach(function (date) {
            let datasetCopy;
            if (entry == 'countPerStates') {
                datasetCopy = stateDataset;
            } else if (entry == 'countPerTrackers') {
                datasetCopy  = trackerDataset;
            } else if (entry == 'countPerPriority') {
                datasetCopy  = priorityDataset;
            } else if (entry == 'countPerSeverity') {
                datasetCopy  = severityDataset;
            }

            datasetCopy.labels.push(date);
            Object.keys(history.data[entry][date]).forEach(function (count, index) {
                let tempDataset;

                if (datasetCopy.datasets[index]) {
                    tempDataset = datasetCopy.datasets[index];
                } else {
                    tempDataset = {label: count, data: []};
                }

                tempDataset.data.push(history.data[entry][date][count]);
                datasetCopy.datasets[index] = tempDataset;

                Object.keys(lineChartOptions).forEach(function (attr) {
                    datasetCopy.datasets[index][attr] = lineChartOptions[attr];
                });

                datasetCopy.datasets[index]['backgroundColor'] = convertRgb2Rgba(colors[index], 0.4);
                datasetCopy.datasets[index]['borderColor'] = convertRgb2Rgba(colors[index], 1);
                datasetCopy.datasets[index]['pointBorderColor'] = convertRgb2Rgba(colors[index], 1);
                datasetCopy.datasets[index]['pointHoverBackgroundColor'] = convertRgb2Rgba(colors[index], 1);
            });
        });
    });

    let ctxIssueStats = document.getElementById("canvas-issue-stats").getContext("2d");
    let issueStatsLineChart = new Chart(ctxIssueStats, {
        type: 'line',
        data: priorityDataset,
        options: {
            legend: {
                fullWidth: true,
                position: 'bottom',
                labels: {
                    boxWidth: 13,
                    fontSize: 13,
                    padding: 7,
                }
            }
        }
    });
});

Template.projectStats.helpers({
});

Template.projectStats.events({
});

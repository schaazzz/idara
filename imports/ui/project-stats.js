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

let ctxIssueStats;
let issueStatsLineChart = null;
let stateDataset;
let trackerDataset;
let priorityDataset;
let severityDataset;
let totalCount;
let totalCountInitialized = false;

function convertRgb2Rgba(color, alpha) {
    let r = color[1] + color[2];
    let g = color[3] + color[4];
    let b = color[5] + color[6];

    r = parseInt('0x' + r).toString();
    g = parseInt('0x' + g).toString();
    b = parseInt('0x' + b).toString();

    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
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

        let fontSize = (height / 90).toFixed(2);

        ctx.fillStyle = '#34495e';
        ctx.font = 'bold ' +fontSize + "em Lato, Helvetica, Arial, sans-serif";
        ctx.textBaseline = "middle";

        let count = 0;
        Object.keys(totalCount).forEach(function (key) {
            if (totalCount[key].visible) {
                count += totalCount[key].count;
            }
        });
        let text = count;
        let textX = Math.round((width - ctx.measureText(text).width) / 2);
        let textY = height / 2.35;

        if (totalCountInitialized) {
            ctx.fillText(text, textX, textY);
        }

        text = 'Unresolved';
        ctx.font = "bold 24px Lato, Helvetica, Arial, sans-serif";
        textX = 25;
        textY = 25;
        ctx.fillText(text, textX, textY);

        text = 'Issues';
        textY = 45;
        ctx.fillText(text, textX, textY);

    }
});

Template.projectStats.onCreated(function onCreated() {
    stateDataset = {labels: [], datasets: []};
    trackerDataset = {labels: [], datasets: []};
    priorityDataset = {labels: [], datasets: []};
    severityDataset = {labels: [], datasets: []};
    totalCount = {};

    if (issueStatsLineChart != null) {
        issueStatsLineChart.destroy();
        issueStatsLineChart = null;
    }
});

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

    totalCountInitialized = true;

    let canvasOpenIssues = document.getElementById("canvas-open-issues");
    let ctxOpenIssues = canvasOpenIssues.getContext("2d");
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

    ctxIssueStats = document.getElementById("canvas-issue-stats").getContext("2d");
    issueStatsLineChart = new Chart(ctxIssueStats, {
        type: 'line',
        data: stateDataset,
        options: {
            title: {
                display: true,
                position: 'top',
                text: '     ',
            },
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

Template.projectStats.onDestroyed(function onDestroyed() {
});

Template.projectStats.helpers({
    issuesFiledThisWeek() {
        var start = moment().startOf('isoweek').format('YYYY-MM-DD HH:mm');
        var end = moment().endOf('isoweek').format('YYYY-MM-DD HH:mm');
        return (Issues.find({'createdAt': {$lt: end, $gt: start}}).count());
    },
    overdueIssues() {
        var today = moment().startOf('day').format('YYYY-MM-DD');
        return (Issues.find({'dueDate': {$lt: today}, 'state': {$ne: 'Closed'}}).count());
    },
    dueThisWeek() {
        var start = moment().format('YYYY-MM-DD HH:mm');
        var end = moment().endOf('isoweek').format('YYYY-MM-DD HH:mm');
        return (Issues.find({'dueDate': {$lte: end, $gte: start}}).count());
    },
    graphs() {
        var options = [
            'Issue Filtered by States',
            'Issues Filtered by Trackers',
            'Issues Filtered by Priority',
            'Issues Filtered by Severity'];

        return options;
    }
});

Template.projectStats.events({
    'change [id=select-graph]'(event, template) {
        let selection = $('#select-graph option:selected').text();
        let datasetToPlot;

        if (issueStatsLineChart != null) {
            issueStatsLineChart.destroy();
            issueStatsLineChart = null;
        }

        if (selection.indexOf('Trackers') >= 0) {
            datasetToPlot = trackerDataset;
        } else if (selection.indexOf('States') >= 0) {
            datasetToPlot = stateDataset;
        } else if (selection.indexOf('Priority') >= 0) {
            datasetToPlot = priorityDataset;
        } else if (selection.indexOf('Severity') >= 0) {
            datasetToPlot = severityDataset;
        }

        ctxIssueStats = document.getElementById("canvas-issue-stats").getContext("2d");
        issueStatsLineChart = new Chart(ctxIssueStats, {
            type: 'line',
            data: datasetToPlot,
            options: {
                title: {
                    display: true,
                    position: 'top',
                    text: '     ',
                },
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
    },
});

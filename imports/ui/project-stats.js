import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import './project-stats.html';

var myDoughnutChart;

Template.projectStats.onCreated(function onCreated() {
});

Template.projectStats.onRendered(function onRendered() {
    var data = {
        labels: [
            "Red",
            "Blue",
            "Yellow"
        ],
        datasets: [{
            data: [300, 50, 100],
            backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56"
            ],
            hoverBackgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56"
            ]
        }]
    };

    var ctx = document.getElementById("myChart").getContext("2d");
    console.log(ctx);
    myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data
    });
    console.log(myDoughnutChart);
});

Template.projectStats.helpers({

});

Template.projectStats.events({

});

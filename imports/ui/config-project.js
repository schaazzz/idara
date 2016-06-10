import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import './config-project.html';

var xmlEditor = null;
var thisProject = null;
var pmUsersUpdated = new ReactiveVar(true);

Template.configProject.onCreated( function onCreated() {
    thisProject = Projects.findOne({'name': activeProject.get()})
});

Template.configProject.onRendered(function onRendered() {
    this.$('#chk-open-issue-access').radiocheck();

    if (thisProject.noIssueFilingRestrictions) {
        this.$('#chk-open-issue-access').radiocheck('check');
        this.$("#div-pm-access").addClass("disabled-div");
    }

    this.$('#input-projname').val(thisProject.name);
    this.$('#select-admin').val(thisProject.admin);
    this.$('#txt-projdesc').val(thisProject.description);

    xmlEditor = CodeMirror.fromTextArea(
        document.getElementById('txt-custom-fields'),
        {indentUnit: 4, tabSize: 4, indentWithTabs: false, smartIndent: true, mode: 'xml', cursorHeight: 0.85});

    $(".CodeMirror").css('font-size','10pt');
    $(".CodeMirror").css('border', '2px solid #1abc9c');
    $(".CodeMirror").css('border-radius', '5px');

    if (thisProject.customFieldsXml) {
        var xmlDoc = $($.parseXML(thisProject.customFieldsXml));
        var original = new XMLSerializer().serializeToString(xmlDoc[0]);

        xmlEditor.setValue(original);
        xmlEditor.execCommand('selectAll');
        xmlEditor.execCommand('indentAuto');
        xmlEditor.execCommand('goDocStart');
    }

    xmlEditor.setSize('100%', '350');
});

Template.configProject.helpers({
    users() {
        return Meteor.users.find({});
    },
    usersWithPmAcess() {
        if (pmUsersUpdated.get()) {
            pmUsersUpdated.set(false);
        }

        return thisProject.pmUsers;
    }
});

Template.configProject.events({
    'click [id=btn-save-changes]'(event, template) {
        Meteor.call(
            'projects.update',
            thisProject._id,
            $('#input-projname').val(),
            $('#txt-projdesc').val(),
            $('#select-admin').val(),
            thisProject.pmUsers,
            thisProject.noIssueFilingRestrictions,
            xmlEditor.getValue());

        target.set('projects');
    },
    'click [id=btn-add-pm-user]'(event, template) {
        var selection = $('#select-pm-user').val();

        if(selection != -1) {
            if (thisProject.pmUsers.indexOf(selection) < 0) {
                thisProject.pmUsers.push(selection);
                pmUsersUpdated.set(true);
            }
        }
    },
    'click [name=a-remove-pm-user]'(event, template) {
        index = thisProject.pmUsers.indexOf(event.target.id);
        if (index >= 0) {
            thisProject.pmUsers.splice(index, 1);
            pmUsersUpdated.set(true);
        }
    },
    'change [id=chk-open-issue-access]'(event, template) {
        if (event.target.checked) {
            $("#div-pm-access").addClass("disabled-div");
            thisProject.noIssueFilingRestrictions = true;
        } else {
            $("#div-pm-access").removeClass("disabled-div");
            thisProject.noIssueFilingRestrictions = false;
        }
    }
});

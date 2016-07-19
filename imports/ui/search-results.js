import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import '../api/helpers';
import './search-results.html';

let projectSelected = new ReactiveVar(false);
let filterSelected = new ReactiveVar(false);
let activeFilter = new ReactiveVar();
let optionsChanged = new ReactiveVar(false);
let searchQueryCollection = new ReactiveVar();
let searchQuery = {};
let options = [];
let customFields = [];

function createSearchTxt(query) {
    let queryTxt = {};

    if (query.project) {
        queryTxt['project'] = 'Project is ' + query.project;
    }

    if (query.responsible) {
        if (query.responsible.$ne) {
            queryTxt['responsible'] = 'Responsible is not ' + query.responsible.$ne;
        } else {
            queryTxt['responsible'] = 'Responsible is ' + query.responsible;
        }
    }

    if (query.tracker) {
        if (query.tracker.$ne) {
            queryTxt['tracker'] = 'Tracker is not ' + query.tracker.$ne;
        } else {
            queryTxt['tracker'] = 'Tracker is ' + query.tracker;
        }
    }

    if (query.priority) {
        if (query.priority.$ne) {
            queryTxt['priority'] = 'Priority is not ' + query.priority.$ne;
        } else {
            queryTxt['priority'] = 'Priority is ' + query.priority;
        }
    }

    if (query.severity) {
        if (query.severity.$ne) {
            queryTxt['severity'] = 'Severity is not ' + query.severity.$ne;
        } else {
            queryTxt['severity'] = 'Severity is ' + query.severity;
        }
    }

    if (query.priority) {
        if (query.priority.$ne) {
            queryTxt['priority'] = 'Priority is not ' + query.priority.$ne;
        } else {
            queryTxt['priority'] = 'Priority is ' + query.priority;
        }
    }

    if (query.$and) {
        for (var i = 0; i < query.$and.length; i++) {
            if (query.$and[i].customFields.$elemMatch.value.$ne) {
                queryTxt[query.$and[i].customFields.$elemMatch.title] =
                    query.$and[i].customFields.$elemMatch.title + ' is not ' + query.$and[i].customFields.$elemMatch.value.$ne;
            } else {
                queryTxt[query.$and[i].customFields.$elemMatch.title] =
                    query.$and[i].customFields.$elemMatch.title + ' is ' + query.$and[i].customFields.$elemMatch.value;
            }
        }
    }

    return (queryTxt);
}

Template.searchResults.onRendered(function onRendered() {
    searchQueryCollection.set({count: 0, queries: {}});

    if (activeProject.get()) {
        $('#select-project').val(activeProject.get());
        projectSelected.set(true);
    } else {
        projectSelected.set(false);
    }
});

Template.searchResults.helpers({
    isProjectSelected() {
        return projectSelected.get();
    },
    isFilterSelected() {
            return filterSelected.get();
    },
    projects() {
        return Projects.find({});
    },
    options() {
        let result = {optionsChanged: optionsChanged.get(), array: options};
        optionsChanged.set(false);

        return (result);
    },
    searchResults() {
        let results;
        if (projectSelected.get()) {
            results = Issues.find({project: activeProject.get(), title: {$regex: searchTerm.get()}});
        } else {
            results = Issues.find({title: {$regex: searchTerm.get()}});
        }

        return (results);
    },
    searchQueries() {
        let singleQueryTxtArray = [];
        let searchQueryTxtArrays = [];
        let searchQueries = searchQueryCollection.get();

        Object.keys(searchQueries.queries).forEach(function (key) {
            let singleQueryTxt = createSearchTxt(searchQueries.queries[key]);
            console.log(singleQueryTxt);
            singleQueryTxtArray = [];
            Object.keys(singleQueryTxt).forEach(function (key) {
                singleQueryTxtArray.push(singleQueryTxt[key]);
            });

            searchQueryTxtArrays.push(singleQueryTxtArray);
        });

        // let issues = Issues.find(searchQueryCollection.get().queries[0]).fetch();
        console.log(searchQueryTxtArrays);
        return (searchQueryTxtArrays);
    },
    customFieldsRows() {
        customFields = parseCustomFieldRows(activeProject.get());
        return (customFields);
    }
});

Template.searchResults.events({
    'click [name=open-issue-page]'(event, template) {
        var project = event.target.id;
        var issue = project.split(':')[1];

        project = project.split(':')[0];
        activeProject.set(project);
        activeIssue.set(issue);
        target.set('issuePage');
    },
    'click [name=open-project-page]'(event, template) {
        activeProject.set(event.target.id);
        target.set('projectPage');
    },
    'click #btn-add-filter'(event, template) {
        searchQuery = {};
        options = [];
        filterSelected.set(false);
        activeFilter.set(void 0);
        optionsChanged.set(false);
        $('#select-filter').val(-1);
        if (projectSelected) {
            searchQuery = {'project': activeProject.get()}
        }
        $('#modal-filter').modal();
    },
    'change #select-project'(event, template) {
        let selection = $('#select-project option:selected').text();

        if (selection != '-1') {
            projectSelected.set(true);
            activeProject.set(selection);
            searchQuery = {'project': activeProject.get()};
        } else {
            projectSelected.set(false);
            activeProject.set(void 0);
        }
    },
    'change #select-filter'(event, template) {
        let selectionTxt = $('#select-filter option:selected').text();
        let selectionVal = $('#select-filter option:selected').val();
        let users = Meteor.users.find({}).fetch();

        if (selectionVal == '-1') {
            options = [];
            optionsChanged.set(true);
            filterSelected.set(false);
            activeFilter.set(void 0);
        } else {
            optionsChanged.set(true);
            filterSelected.set(true);
            activeFilter.set({value: selectionVal, text: selectionTxt});

            if ((selectionTxt =='Responsible') || (selectionTxt == 'Assignee')) {
                options = [];
                for (var i = 0; i < users.length; i++) {
                    options.push(users[i].username);
                }
            } else if (selectionTxt == 'Tracker') {
                options = ['Defect', 'Change Request', 'Enhancement', 'Question'];
            } else if (selectionTxt == 'Priority') {
                options = ['Very Low', 'Low', 'Mid', 'High', 'Very High' ];
            } else if (selectionTxt == 'Severity') {
                options = ['Cosmetic', 'Minor', 'Moderate', 'Major', 'Critical'];
            } else {
                if (selectionVal.indexOf('custom') != -1) {
                    for (var i = 0; i < customFields.length; i++) {
                        if (customFields[i].title == selectionTxt) {
                            options = customFields[i].options;
                        }
                    }
                }
            }
        }
    },
    'click #btn-add-partial-query'(event, template) {
        let selectedOption = $('#select-option option:selected').text();
        let checkEquality = $('#select-equality option:selected').text() == 'is'? true : false;
        let activeFilterCopy = activeFilter.get();
        let activeFilterKey = '';
        let customFieldFilter = false;

        if (activeFilterCopy.text == 'Responsible') {
            activeFilterKey = 'responsible';
        } else if (activeFilterCopy.text == 'Tracker') {
            activeFilterKey = 'tracker';
        } else if (activeFilterCopy.text == 'Priority') {
            activeFilterKey = 'priority';
        } else if (activeFilterCopy.text == 'Severity') {
            activeFilterKey = 'severity';
        } else {
            if (activeFilterCopy.value.indexOf('custom') != -1) {
                customFieldFilter = true;
            }
        }

        if (!customFieldFilter) {
            searchQuery[activeFilterKey] = checkEquality? selectedOption : {$ne: selectedOption};
        } else {
            let valueFilter = checkEquality? {value: selectedOption} : {value: {$ne: selectedOption}};

            if (!searchQuery.$and) {
                searchQuery['$and'] = [];
            } else {
                for (var i = 0; i < searchQuery.$and.length; i++) {
                    if (searchQuery.$and[i].customFields.$elemMatch.title == activeFilterCopy.text) {
                        searchQuery.$and.splice(i, 1);
                        break;
                    }
                }
            }

            searchQuery['$and'].push({
                'customFields': {
                    $elemMatch: {'title': activeFilterCopy.text, 'value': valueFilter.value}
                }
            });
        }
    },
    'click #btn-add-query'(event, template) {
        let searchQueries = searchQueryCollection.get();
        searchQueries.queries[searchQueries.count] = searchQuery;
        searchQueries.count++;
        searchQueryCollection.set(searchQueries);
    }
});

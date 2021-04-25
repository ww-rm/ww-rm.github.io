// const METADATA = "/static/data/metadata.json";
// const CATEGORIES = "/static/data/categories.json";
// const CONTENTS = "./contents.json";

// fetch(METADATA).then(response => {
//     if (response.ok) {
//         response.json().then(json => {
//             console.log(json);
//         })
//     } else {
//         console.log(response.status + ': ' + response.statusText);
//     };
// });

PageRenderer.renderMetadata();
PageRenderer.renderCategories();
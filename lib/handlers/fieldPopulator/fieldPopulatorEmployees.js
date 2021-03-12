async function fieldPopulatorEmployees(req, res) {
  const {
    envoy: {
      meta: {
        location: {
          id: locationId,
        },
        params: { 
          page,
          search,
        },
      },
      userAPI,
    },
  } = req;

  /*
   * Results from this page will appear similar to the below:
   * "envoyProtectExcludeEmployees"=>["8579613", "13451241"]
   *  - Key ---^                      ^           ^
   *  - Employee IDs -----------------|-----------|
   */

  const pageNum = Number(page);
  const pageSize = 100;
  let targetPage = 0;

  if (page !== 1) {
    const tempPage = pageNum - 1;
    targetPage = tempPage * pageSize;
  }
  const parameters = {
    'filter[query]': search || undefined,
    'page[limit]': pageSize,
    'page[offset]': targetPage,
    sort: 'name',
  };
  const allEmployees = await userAPI.locationEmployees(locationId, parameters);
  const employeesOptions = allEmployees.map(employee => ({ value: employee.id, label: `${employee.attributes.name}` }));
  res.send(employeesOptions);
}

module.exports = fieldPopulatorEmployees;

$or: [
  {
    $regexMatch: {
      input: "$fullName",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$lastName",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$firstName",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$reverseFullName",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$email",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$phoneNumber",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$countryCode",
      regex: filters.search,
      options: "ix",
    },
  },

  {
    $regexMatch: {
      input: "$source",
      regex: filters.search,
      options: "ix",
    },
  },

  {
    $regexMatch: {
      input: "$confirmationNumber",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$roomNumber",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$checkInString",
      regex: filters.search,
      options: "ix",
    },
  },
  {
    $regexMatch: {
      input: "$checkOutString",
      regex: filters.search,
      options: "ix",
    },
  },
],
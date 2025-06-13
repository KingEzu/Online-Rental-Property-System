require('dotenv').config();
const pool = require('../config/db');

const reportListing = async (userId,listingId,reportDate,reportBody) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.
        execute('INSERT INTO reports(user_id,listing_id,report_date,report_body)VALUES(?,?,?,?)',
         [userId,listingId,reportDate,reportBody]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    } 
}

const getListingCount = async (filterModel) => {
  const connection = await pool.getConnection();
  try {
    let whereClause = ' listing_status = 3000 ';
    let AND = '';
    for (const property in filterModel) {
      if(whereClause) AND = 'AND';  
      if (filterModel.hasOwnProperty(property)) {
        const value = filterModel[property];
        switch (typeof value) {
          case 'string':
            if (property === 'latitude' || property === 'longitude') {
                whereClause += ` ${AND} listing.${property} like '${value.substring(0,5)}'`;
            }else{
                whereClause += ` ${AND} listing.${property} = '${value}'`;
            }
            break;
          case 'number':
            if (property === 'minimum_price') {
              whereClause += ` ${AND} listing.price_per_duration > ${value}`;
            } else if (property === 'maximum_price') {
                whereClause += ` ${AND} listing.price_per_duration < ${value}`;
            }else {
              whereClause += ` ${AND} listing.${property} = ${value}`;
            }
            break;
          default:
            break;
        }
      }
    }

    const selectionQuery = `
    SELECT COUNT(*) AS listing_count FROM listing ${whereClause ? `
    WHERE ${whereClause.slice(4)}` : ''};`;

    const [rows] = await connection.execute(selectionQuery);
    return rows[0];
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
}

const getListingPage = async (page, filterModel) => {
  const connection = await pool.getConnection();
  connection.beginTransaction();

  try {
    const offset = (page - 1) * 40;
    let whereClause = ' listing_status = 3000 ';
    let AND = '';

    if (filterModel) {
      const filteredModel = Object.fromEntries(
        Object.entries(filterModel).filter(([_, value]) => Boolean(value))
      );

      for (const property in filteredModel) {
        if (whereClause) AND = 'AND';
        if (filteredModel.hasOwnProperty(property)) {
          const value = filteredModel[property];
          switch (typeof value) {
            case 'string':
              if (property === 'latitude' || property === 'longitude') {
                whereClause += ` ${AND} listing.${property} LIKE '${value.substring(0, 5)}%'`;
              } else {
                whereClause += ` ${AND} listing.${property} = '${value}'`;
              }
              break;
            case 'number':
              if (property === 'minimum_price') {
                whereClause += ` ${AND} listing.price_per_duration > ${value}`;
              } else if (property === 'maximum_price') {
                whereClause += ` ${AND} listing.price_per_duration < ${value}`;
              } else {
                whereClause += ` ${AND} listing.${property} = ${value}`;
              }
              break;
            default:
              break;
          }
        }
      }
    }

    const selectionQuery = `
      WITH ListingCount AS (
        SELECT COUNT(*) AS listing_count
        FROM listing
        ${whereClause ? `WHERE ${whereClause}` : ''}
      )
      SELECT 
        listing.*,
        (SELECT JSON_ARRAYAGG(amenities.name) FROM amenities WHERE amenities.listing_id = listing.listing_id) AS amenities,
        (SELECT COUNT(*) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id) AS review_count,
        (SELECT FLOOR(AVG(rating)) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id) AS average_rating,
        (SELECT JSON_ARRAYAGG(describing_terms.term) FROM describing_terms WHERE describing_terms.listing_id = listing.listing_id) AS describing_terms,
        (SELECT JSON_ARRAYAGG(listing_photos.url) FROM listing_photos WHERE listing_photos.listing_id = listing.listing_id) AS photo_urls,
        (SELECT listing_count FROM ListingCount) AS listing_count
      FROM listing
      ${whereClause ? `WHERE ${whereClause}` : ''}
      LIMIT 40 OFFSET ${offset};`;



    const [rows] = await connection.execute(selectionQuery);
    
    if (rows && rows.length > 0) {
      const listingCount = rows[0].listing_count;
      if (listingCount === 0) {
        connection.commit();
        return { listing_count: 0, listings: [] };
      }

      const listings = rows.map(row => {
        delete row.listing_count;
        return row;
      });

      const listing_ids = listings.map(l => l.listing_id);
      const idList = listing_ids.join(',');
      const updateQuery = `UPDATE listing SET views = views + 1 WHERE listing_id IN (${idList})`;
      await connection.execute(updateQuery);

      connection.commit();
      return { listing_count: listingCount, listings: listings };
    } else {
      connection.commit();
      return { listing_count: 0, listings: [] };
    }
  } catch (err) {
    connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}


const getAllListings = async () => {
  const connection = await pool.getConnection();
  connection.beginTransaction();

  try {
    const selectionQuery = `
      SELECT 
        listing.*,
        (SELECT JSON_ARRAYAGG(amenities.name) FROM amenities WHERE amenities.listing_id = listing.listing_id) AS amenities,
        (SELECT COUNT(*) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id) AS review_count,
        (SELECT FLOOR(AVG(rating)) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id) AS average_rating,
        (SELECT JSON_ARRAYAGG(describing_terms.term) FROM describing_terms WHERE describing_terms.listing_id = listing.listing_id) AS describing_terms,
        (SELECT user.full_name FROM user WHERE user.user_id = listing.owner_id) AS owner,
        (SELECT JSON_ARRAYAGG(listing_photos.url) FROM listing_photos WHERE listing_photos.listing_id = listing.listing_id) AS photo_urls FROM listing;`;

    const [rows] = await connection.execute(selectionQuery);

    return rows
  } catch (err) {
    connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}



const getMatchingListing = async (searchQuery, page) => {
  const connection = await pool.getConnection();
  try {
    const offset = (page - 1) * 40;
    let whereClause = ' WHERE listing.listing_status = 3000 ';
    let searchValues = [];

    if (searchQuery) {
      const searchColumns = ['title', 'description', 'building_name', 'sub_city', 'woreda', 'area_name'];
      const searchConditions = searchColumns.map(column => `listing.${column} LIKE ?`).join(' OR ');
      const describingTermsCondition = 'describing_terms.term LIKE ?';
      whereClause += ` AND (${searchConditions} OR ${describingTermsCondition})`;
      searchValues = Array(searchColumns.length).fill(`%${searchQuery}%`).concat(`%${searchQuery}%`);
    }

    const countQuery = `
      SELECT COUNT(DISTINCT listing.listing_id) AS listing_count
      FROM listing
      LEFT JOIN describing_terms ON listing.listing_id = describing_terms.listing_id
      ${whereClause};`;

    const [countResult] = await connection.execute(countQuery, searchValues);
    const listing_count = countResult[0].listing_count;
    
    const selectionQuery = `SELECT listing.*, COALESCE((SELECT JSON_ARRAYAGG(amenities.name)
     FROM amenities WHERE amenities.listing_id = listing.listing_id), JSON_ARRAY()) AS amenities,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id), 0) AS review_count,
      COALESCE((SELECT FLOOR(AVG(rating)) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id), 0) AS average_rating, 
      COALESCE((SELECT JSON_ARRAYAGG(describing_terms.term) FROM describing_terms WHERE describing_terms.listing_id = listing.listing_id), JSON_ARRAY()) AS describing_terms, 
      COALESCE((SELECT JSON_ARRAYAGG(listing_photos.url) FROM listing_photos WHERE listing_photos.listing_id = listing.listing_id), JSON_ARRAY()) AS photo_urls 
      FROM listing LEFT JOIN describing_terms ON listing.listing_id = describing_terms.listing_id ${whereClause} 
      GROUP BY listing.listing_id LIMIT 40 OFFSET ${offset};`;

    const [rows] = await connection.execute(selectionQuery, searchValues);

    if (rows && rows.length > 0) {
      const listing_ids = rows.map((l) => l.listing_id);
      const idList = listing_ids.join(',');
      const updateQuery = `UPDATE listing SET views = views + 1 WHERE listing_id IN (${idList})`;
      await connection.execute(updateQuery); 
    }

    return { listing_count, listings: rows };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

const getOwnerListing = async (owner_id) => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
     `SELECT listing.*,
      COALESCE((SELECT JSON_ARRAYAGG(amenities.name) 
          FROM amenities 
          WHERE amenities.listing_id = listing.listing_id), JSON_ARRAY()
      ) AS amenities,
      COALESCE((SELECT COUNT(*) 
          FROM reviews 
          WHERE reviews.reviewed_listing_id = listing.listing_id), 0
      ) AS review_count,
      COALESCE((SELECT FLOOR(AVG(rating)) 
          FROM reviews 
          WHERE reviews.reviewed_listing_id = listing.listing_id), 0
      ) AS average_rating,
      COALESCE((SELECT JSON_ARRAYAGG(describing_terms.term) 
          FROM describing_terms 
          WHERE describing_terms.listing_id = listing.listing_id), JSON_ARRAY()
      ) AS describing_terms,
      COALESCE((SELECT JSON_ARRAYAGG(listing_photos.url) 
          FROM listing_photos 
          WHERE listing_photos.listing_id = listing.listing_id), JSON_ARRAY()
      ) AS photo_urls FROM listing 
      WHERE listing.owner_id = ? GROUP BY listing.listing_id;`, [owner_id]);
      return rows;
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }  
}

const createListing = async (listing, amenities, describing_terms) =>{
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
      const [rows] = await connection.execute(`INSERT INTO listing(
      owner_id,type,title,description,sub_city,woreda,area_name,latitude,longitude,
      price_per_duration,payment_currency,total_area_square_meter,listing_status,
      floor_number,distance_from_road_in_meters,security_guards,lease_duration_days,
      tax_responsibility,building_name,catering_rooms,back_stages,date_created,furnished,
      backrooms,displays,storage_capacity_square_meter,customer_service_desks,number_of_bedrooms,
      number_of_bathrooms,number_of_kitchens,parking_capacity,ceiling_height_in_meter,number_of_floors,
      loading_docks,guest_capacity) 
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,Object.values(listing));

      if(amenities && amenities.length > 0){
        const amenitiesPlaceholders = amenities.map(() => '(?, ?)').join(',');
        const amenitiesValues = []; 
        Object.values(amenities).map((v, i) => {
          amenitiesValues.push(rows.insertId);
          amenitiesValues.push(v);
        });
        const amenitiesQuery = `INSERT INTO amenities (listing_id,name) VALUES ${amenitiesPlaceholders}`;
        await connection.execute(amenitiesQuery, amenitiesValues);
      }

      if (describing_terms && describing_terms.length > 0) {
          const dTplaceholders = describing_terms.map(() => '(?, ?)').join(',');
          const dTvalues = []; 
          Object.values(describing_terms).map((v, i) => {
            dTvalues.push(rows.insertId);
            dTvalues.push(v);
          });
          const dTquery = `INSERT INTO describing_terms (listing_id,term) VALUES ${dTplaceholders}`;
          await connection.execute(dTquery, dTvalues);
      }
      await connection.commit();
      return rows;
  } catch (err) {
      await connection.rollback();
      throw err;
  }finally{
      connection.release();
  }
}

const modifyListing = async (listingId, newListing) => {
  const connection = await pool.getConnection();
  try {
    const SET_CLAUSES = Object.keys(newListing)
      .map(key => `${key} = ?`)
      .join(', ');
      const query = `
          UPDATE listing
          SET ${SET_CLAUSES}
          WHERE listing_id = ?;
      `;
      const values = [
          ...Object.values(newListing),
          listingId, 
      ];
      const [rows] = await connection.execute(query, values);
      return rows;
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
}

const removeListing = async (listingId) =>{
  const connection = await pool.getConnection();
  try {
      const [rows] = await connection.execute('DELETE FROM listing WHERE listing_id = ?;', [listingId]);
      return rows;
  } catch (err) {
      throw err;
  }finally{
      connection.release();
  }
}

const getListing = async (listingId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
          `SELECT 
          listing.*,COALESCE((SELECT JSON_ARRAYAGG(amenities.name) 
          FROM amenities WHERE amenities.listing_id = listing.listing_id), JSON_ARRAY()
          ) AS amenities,
          COALESCE((SELECT COUNT(*) FROM reviews WHERE reviews.reviewed_listing_id = listing.listing_id), 0
          ) AS review_count,
          COALESCE((SELECT FLOOR(AVG(rating)) FROM reviews 
              WHERE reviews.reviewed_listing_id = listing.listing_id), 0
          ) AS average_rating,
          COALESCE((SELECT JSON_ARRAYAGG(describing_terms.term) FROM describing_terms 
              WHERE describing_terms.listing_id = listing.listing_id), JSON_ARRAY()
          ) AS describing_terms,
          COALESCE((SELECT JSON_ARRAYAGG(listing_photos.url) FROM listing_photos 
              WHERE listing_photos.listing_id = listing.listing_id), JSON_ARRAY()
          ) AS photo_urls FROM listing 
          WHERE listing.listing_id = ? GROUP BY listing.listing_id;`,[listingId]);
        return rows[0];
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const setAvailable = async (listingId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
        'UPDATE listing SET listing_status = ? WHERE listing_id = ?;', [3000,listingId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const setUnAvailable = async (listingId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
        'UPDATE listing SET listing_status = ? WHERE listing_id = ?;', [1000,listingId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }     
}


const addDescribingTerms = async (listing_id, describing_terms) => {
  const connection = await pool.getConnection();
  try {
    const placeholders = describing_terms.map(() => '(?, ?)').join(',');
    const values = []; 
    
    Object.values(describing_terms).map((v, i) => {
        values.push(listing_id);
        values.push(v);
    });

    const query = `INSERT INTO describing_terms (listing_id, term) VALUES ${placeholders}`;
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    throw err;
  }finally{
      connection.release();
  }
};

const removeDescribingTerms = async (listing_id) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(`DELETE FROM describing_terms WHERE listing_id = ?;`, [listing_id]);
    return result;
  } catch (err) {
    throw err;
  }finally{
      connection.release();
  }
};

const addAmenities = async (listing_id, amenities) => {
    const connection = await pool.getConnection();
    try {
      const placeholders = amenities.map(() => '(?, ?)').join(',');
      const values = []; 
      
      Object.values(amenities).map((v, i) => {
          values.push(listing_id);
          values.push(v);
      });

      const query = `INSERT INTO amenities (listing_id, name) VALUES ${placeholders}`;
      const [rows] = await connection.execute(query, values);
      return rows;
    } catch (err) {
      throw err;
    }finally{
        connection.release();
    }
};
const removeAmenities = async (listing_id) => {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`DELETE FROM amenities WHERE listing_id = ?;`, [listing_id]);
      return result;
    } catch (err) {
      throw err;
    }finally{
        connection.release();
    }
};

const addPhotos = async (listing_id, urls) => {
    const connection = await pool.getConnection();
    try {
      
      const placeholders = urls.map(() => '(?, ?)').join(',');
      const values = []; 
      
      Object.values(urls).map((v, i) => {
          values.push(listing_id);
          values.push(v);
      });

      const query = `INSERT INTO listing_photos (listing_id,url) VALUES ${placeholders}`;
      const [rows] = await connection.execute(query, values);
      return rows;
    } catch (err) {
      throw err;
    }finally{
        connection.release();
    }
};

const removePhotos = async (listing_id) => {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`DELETE FROM listing_photos WHERE listing_id = ?`, [listing_id]);
      return result;
    } catch (err) {
      throw err;
    }finally{
        connection.release();
    }
};
  
module.exports = {
    createListing,getListing,getOwnerListing,
    modifyListing,removeListing,setAvailable,
    setUnAvailable,reportListing,addPhotos,removePhotos,addAmenities,
    removeAmenities,getListingPage,getAllListings ,getMatchingListing, getListingCount,
    addDescribingTerms, removeDescribingTerms
}
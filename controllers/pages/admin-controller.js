const { Restaurant, User, Category } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')

const adminController = {
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true,
      nest: true,
      attributes: ['id', 'name', 'email', 'password', 'isAdmin', 'createdAt', 'updatedAt']
    })
      .then(users => {
        console.log(users)
        res.render('admin/users', { users })
      })
      .catch(err => next(err))
  },
  patchUser: (req, res, next) => {
    console.log(`接收到 PATCH 請求，使用者 ID：${req.params.id}`)

    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error('User not found!')
        if (user.email === 'root@example.com') {
          req.flash('error_messages', '禁止變更 root 權限')
          return res.redirect('back')
        }
        return user.update({ isAdmin: !user.isAdmin })
      })
      .then(updatedUser => {
        console.log(`新的使用者 isAdmin 狀態：${updatedUser.isAdmin}`)
        req.flash('success_messages', '使用者權限變更成功')
        return res.redirect('/admin/users')
      })
      .catch(err => {
        console.error('更新使用者權限時出錯：', err)
        next(err)
      })
  },
  getRestaurants: (req, res, next) => {
    Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => res.render('admin/restaurants', { restaurants }))
      .catch(err => next(err))
  },
  createRestaurant: (req, res, next) => {
    return Category.findAll({
      raw: true
    })
      .then(categories => res.render('admin/create-restaurant', { categories }))
      .catch(err => next(err))
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    const { file } = req
    imgurFileHandler(file)
      .then(filePath => {
        return Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null,
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'Restaurant was successfully created!') // 在畫面顯示成功提示
        res.redirect('/admin/restaurants') // 新增完成後導回後台首頁
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, { // 去資料庫用 id 找一筆資料
      raw: true, // 找到以後整理格式再回傳
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!") //  如果找不到，回傳錯誤訊息，後面不執行
        res.render('admin/restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.id, { raw: true }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error('Restaurant did not exist.')
        res.render('admin/edit-restaurant', { restaurant, categories })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    const { file } = req
    Promise.all([
      Restaurant.findByPk(req.params.id),
      imgurFileHandler(file)
    ])
      .then(([restaurant, filePath]) => {
        if (!restaurant) throw new Error('Restaurant did not exist!')
        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image,
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'Restaurant was updated successfully!')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error('Restaurant did not exist!')
        return restaurant.destroy()
      })
      .then(() => res.redirect('/admin/restaurants'))
      .catch(err => next(err))
  }

}
module.exports = adminController
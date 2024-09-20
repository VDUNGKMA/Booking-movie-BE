// migrations/20231001-update-moviegenres-foreign-keys.js

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Xóa ràng buộc khóa ngoại cũ
        await queryInterface.removeConstraint('MovieGenres', 'moviegenres_ibfk_1');
        await queryInterface.removeConstraint('MovieGenres', 'moviegenres_ibfk_2');

        // Thêm ràng buộc khóa ngoại mới với ON DELETE CASCADE
        await queryInterface.addConstraint('MovieGenres', {
            fields: ['movie_id'],
            type: 'foreign key',
            name: 'moviegenres_ibfk_1',
            references: {
                table: 'Movies',
                field: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        await queryInterface.addConstraint('MovieGenres', {
            fields: ['genre_id'],
            type: 'foreign key',
            name: 'moviegenres_ibfk_2',
            references: {
                table: 'Genres',
                field: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Phục hồi lại ràng buộc khóa ngoại cũ nếu cần
        // ...
    }
};
